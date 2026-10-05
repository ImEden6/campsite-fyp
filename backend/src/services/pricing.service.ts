// Pricing
//
// One place that decides what a stay costs, used both to quote a price (POST /bookings/calculate-price)
// and to price a booking when it is created or changed, so the two can never disagree.
//
//   nightly rate  = site base price, adjusted by every pricing rule that applies to that night
//   subtotal      = sum of the nightly rates
//   equipment     = daily rate x quantity x nights, per item
//   tax           = (subtotal + equipment - discount) x tax rate
//   total         = subtotal + equipment - discount + tax
//   deposit       = total x deposit percentage
//
// Everything is rounded to cents at each step, so the lines shown to a customer always add up.

import type { Prisma, PrismaClient, SiteType } from '@prisma/client';
import prisma from '@/database';
import { config } from '@/config';
import { ApiError } from '@/utils/errors';

const DAY_MS = 24 * 60 * 60 * 1000;

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------

export interface PricingRuleInput {
  id: string;
  name: string;
  siteTypes: SiteType[];
  startDate: Date;
  endDate: Date;
  /** 0-6, Sunday to Saturday. Empty means every day. */
  daysOfWeek: number[];
  priceModifier: number;
  /** multiplier: rate x modifier | percentage: rate x (1 + modifier/100) | fixed: rate + modifier */
  modifierType: string;
  minStay: number | null;
  maxStay: number | null;
  priority: number;
  createdAt?: Date;
}

export interface EquipmentLineInput {
  equipmentId: string;
  name?: string;
  dailyRate: number;
  quantity: number;
}

export interface QuoteInput {
  site: { type: SiteType; basePrice: number };
  start: Date;
  end: Date;
  rules: PricingRuleInput[];
  taxRate: number;
  depositPercentage: number;
  equipment?: EquipmentLineInput[];
  discountAmount?: number;
}

export interface QuoteNight {
  /** YYYY-MM-DD */
  date: string;
  rate: number;
  description: string;
}

export interface QuoteEquipmentLine {
  equipmentId: string;
  name?: string;
  quantity: number;
  dailyRate: number;
  totalAmount: number;
}

/** Shape the frontend expects from POST /bookings/calculate-price, plus the equipment lines. */
export interface Quote {
  basePrice: number;
  nights: number;
  subtotal: number;
  equipmentTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount: number;
  breakdown: QuoteNight[];
  equipment: QuoteEquipmentLine[];
}

// ---------------------------------------------------------------------------------------------
// Pure calculation (no database): easy to test, and the single source of truth for the maths
// ---------------------------------------------------------------------------------------------

const utcDay = (d: Date): number => Math.floor(d.getTime() / DAY_MS);

export function countNights(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / DAY_MS);
}

const ruleApplies = (rule: PricingRuleInput, site: QuoteInput['site'], night: Date, nights: number): boolean => {
  if (rule.siteTypes.length > 0 && !rule.siteTypes.includes(site.type)) return false;

  const day = utcDay(night);
  if (day < utcDay(rule.startDate) || day > utcDay(rule.endDate)) return false;

  if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(night.getUTCDay())) return false;
  if (rule.minStay != null && nights < rule.minStay) return false;
  if (rule.maxStay != null && nights > rule.maxStay) return false;

  return true;
};

const applyRule = (rate: number, rule: PricingRuleInput): number => {
  switch (rule.modifierType) {
    case 'multiplier':
      return rate * rule.priceModifier;
    case 'percentage':
      return rate * (1 + rule.priceModifier / 100);
    case 'fixed':
      return rate + rule.priceModifier;
    default:
      return rate; // an unknown type must never change a price
  }
};

export function computeQuote(input: QuoteInput): Quote {
  const { site, start, end, rules, taxRate, depositPercentage, equipment = [], discountAmount = 0 } = input;

  const nights = countNights(start, end);
  if (!Number.isFinite(nights) || nights < 1) {
    throw new ApiError(400, 'Check-out must be after check-in');
  }

  // Higher priority is applied first; ties fall back to creation order so results are stable
  const ordered = [...rules].sort(
    (a, b) => b.priority - a.priority || (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) || a.id.localeCompare(b.id)
  );

  const startDay = utcDay(start);
  const breakdown: QuoteNight[] = [];

  for (let i = 0; i < nights; i++) {
    const night = new Date((startDay + i) * DAY_MS);
    const applied = ordered.filter((rule) => ruleApplies(rule, site, night, nights));

    let rate = site.basePrice;
    for (const rule of applied) rate = applyRule(rate, rule);

    breakdown.push({
      date: night.toISOString().slice(0, 10),
      rate: round2(Math.max(rate, 0)), // a discount can never make a night cost less than nothing
      description: applied.length > 0 ? applied.map((r) => r.name).join(' + ') : 'Base rate',
    });
  }

  const subtotal = round2(breakdown.reduce((sum, night) => sum + night.rate, 0));

  const equipmentLines: QuoteEquipmentLine[] = equipment.map((item) => ({
    equipmentId: item.equipmentId,
    ...(item.name !== undefined && { name: item.name }),
    quantity: item.quantity,
    dailyRate: item.dailyRate,
    totalAmount: round2(item.dailyRate * item.quantity * nights),
  }));
  const equipmentTotal = round2(equipmentLines.reduce((sum, line) => sum + line.totalAmount, 0));

  const discount = round2(Math.min(Math.max(discountAmount, 0), subtotal + equipmentTotal));
  const taxable = subtotal + equipmentTotal - discount;
  const taxAmount = round2(taxable * taxRate);
  const totalAmount = round2(taxable + taxAmount);

  return {
    basePrice: site.basePrice,
    nights,
    subtotal,
    equipmentTotal,
    discountAmount: discount,
    taxAmount,
    totalAmount,
    depositAmount: round2(totalAmount * (depositPercentage / 100)),
    breakdown,
    equipment: equipmentLines,
  };
}

// ---------------------------------------------------------------------------------------------
// Service: loads the data and calls computeQuote
// ---------------------------------------------------------------------------------------------

type Db = Pick<PrismaClient, 'site' | 'equipment' | 'pricingRule' | 'campsiteSettings'> | Prisma.TransactionClient;

export interface QuoteRequest {
  siteId: string;
  start: Date;
  end: Date;
  equipmentReservations?: Array<{ equipmentId: string; quantity: number }> | undefined;
  /** Use stored daily rates instead of today's (when re-pricing an existing booking). */
  equipmentRates?: Map<string, number> | undefined;
}

/** Merge repeated items so the same equipment is priced and reserved as one line. */
export function mergeEquipmentRequests(items: Array<{ equipmentId: string; quantity: number }> = []) {
  const merged = new Map<string, number>();
  for (const { equipmentId, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, 'Equipment quantity must be a whole number of at least 1');
    }
    merged.set(equipmentId, (merged.get(equipmentId) ?? 0) + quantity);
  }
  return [...merged].map(([equipmentId, quantity]) => ({ equipmentId, quantity }));
}

export class PricingService {
  async quote(request: QuoteRequest, db: Db = prisma): Promise<Quote> {
    const { siteId, start, end } = request;

    if (!(start < end)) throw new ApiError(400, 'Check-out must be after check-in');

    const site = await db.site.findUnique({ where: { id: siteId }, select: { type: true, basePrice: true } });
    if (!site) throw new ApiError(404, 'Site not found');

    const items = mergeEquipmentRequests(request.equipmentReservations);
    const equipmentRows = items.length
      ? await db.equipment.findMany({ where: { id: { in: items.map((i) => i.equipmentId) } }, select: { id: true, name: true, dailyRate: true } })
      : [];
    const byId = new Map(equipmentRows.map((row) => [row.id, row]));

    const equipment: EquipmentLineInput[] = items.map((item) => {
      const row = byId.get(item.equipmentId);
      if (!row) throw new ApiError(404, `Equipment not found: ${item.equipmentId}`);
      return {
        equipmentId: row.id,
        name: row.name,
        quantity: item.quantity,
        dailyRate: request.equipmentRates?.get(row.id) ?? row.dailyRate,
      };
    });

    const [rules, settings] = await Promise.all([
      db.pricingRule.findMany({ where: { isActive: true, startDate: { lte: end }, endDate: { gte: start } } }),
      db.campsiteSettings.findFirst({ orderBy: { createdAt: 'desc' }, select: { taxRate: true, depositPercentage: true } }),
    ]);

    return computeQuote({
      site,
      start,
      end,
      rules,
      equipment,
      taxRate: settings?.taxRate ?? config.business.defaultTaxRate,
      depositPercentage: settings?.depositPercentage ?? config.business.defaultDepositPercentage,
    });
  }
}

export default new PricingService();
