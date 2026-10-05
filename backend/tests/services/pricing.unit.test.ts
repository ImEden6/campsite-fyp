// Pricing maths (pure: no database)

import { describe, it, expect } from 'vitest';
import { computeQuote, countNights, mergeEquipmentRequests, type PricingRuleInput, type QuoteInput } from '@/services/pricing.service';

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const rule = (overrides: Partial<PricingRuleInput> = {}): PricingRuleInput => ({
  id: 'r1',
  name: 'Rule',
  siteTypes: [],
  startDate: d('2030-01-01'),
  endDate: d('2030-12-31'),
  daysOfWeek: [],
  priceModifier: 1,
  modifierType: 'multiplier',
  minStay: null,
  maxStay: null,
  priority: 1,
  ...overrides,
});

// 2030-06-03 is a Monday
const quote = (overrides: Partial<QuoteInput> = {}) =>
  computeQuote({
    site: { type: 'TENT', basePrice: 50 },
    start: d('2030-06-03'),
    end: d('2030-06-06'), // 3 nights: Mon, Tue, Wed
    rules: [],
    taxRate: 0.08,
    depositPercentage: 25,
    ...overrides,
  });

describe('computeQuote', () => {
  describe('base price, tax and deposit', () => {
    it('charges the base rate for every night, then tax, then works out the deposit', () => {
      const q = quote();

      expect(q).toMatchObject({
        basePrice: 50,
        nights: 3,
        subtotal: 150,
        equipmentTotal: 0,
        discountAmount: 0,
        taxAmount: 12,
        totalAmount: 162,
        depositAmount: 40.5,
      });
    });

    it('lists each night with its date, rate and why', () => {
      expect(quote().breakdown).toEqual([
        { date: '2030-06-03', rate: 50, description: 'Base rate' },
        { date: '2030-06-04', rate: 50, description: 'Base rate' },
        { date: '2030-06-05', rate: 50, description: 'Base rate' },
      ]);
    });

    it('adds no tax at a zero rate', () => {
      expect(quote({ taxRate: 0 })).toMatchObject({ taxAmount: 0, totalAmount: 150 });
    });

    it('rounds to cents at each step so the lines add up', () => {
      const q = quote({ site: { type: 'TENT', basePrice: 33.333 }, taxRate: 0.0825 });

      expect(q.breakdown.map((n) => n.rate)).toEqual([33.33, 33.33, 33.33]);
      expect(q.subtotal).toBe(99.99);
      expect(q.taxAmount).toBe(8.25);
      expect(q.totalAmount).toBe(108.24);
    });
  });

  describe('number of nights', () => {
    it('counts nights between the dates', () => {
      expect(countNights(d('2030-06-03'), d('2030-06-04'))).toBe(1);
      expect(countNights(d('2030-06-03'), d('2030-07-03'))).toBe(30);
    });

    it('rounds a part-day up, as the booking has always done', () => {
      const q = quote({ start: new Date('2030-06-03T15:00:00Z'), end: new Date('2030-06-05T11:00:00Z') });

      expect(q.nights).toBe(2);
      expect(q.breakdown.map((n) => n.date)).toEqual(['2030-06-03', '2030-06-04']);
    });

    it.each([
      ['the same day', d('2030-06-03'), d('2030-06-03')],
      ['check-out before check-in', d('2030-06-05'), d('2030-06-03')],
    ])('rejects %s', (_label, start, end) => {
      expect(() => quote({ start, end })).toThrowError(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('pricing rules', () => {
    it('applies a multiplier only to nights inside the rule dates (end date included)', () => {
      const q = quote({ rules: [rule({ name: 'Peak', priceModifier: 2, startDate: d('2030-06-04'), endDate: d('2030-06-05') })] });

      expect(q.breakdown.map((n) => [n.rate, n.description])).toEqual([
        [50, 'Base rate'],
        [100, 'Peak'],
        [100, 'Peak'],
      ]);
      expect(q.subtotal).toBe(250);
    });

    it('supports percentage and fixed adjustments', () => {
      expect(quote({ rules: [rule({ modifierType: 'percentage', priceModifier: 20 })] }).breakdown[0]!.rate).toBe(60);
      expect(quote({ rules: [rule({ modifierType: 'percentage', priceModifier: -10 })] }).breakdown[0]!.rate).toBe(45);
      expect(quote({ rules: [rule({ modifierType: 'fixed', priceModifier: 15 })] }).breakdown[0]!.rate).toBe(65);
      expect(quote({ rules: [rule({ modifierType: 'fixed', priceModifier: -5 })] }).breakdown[0]!.rate).toBe(45);
    });

    it('applies higher-priority rules first, so the order changes the price', () => {
      const plusTen = (priority: number) => rule({ id: 'a', name: 'Fee', modifierType: 'fixed', priceModifier: 10, priority });
      const double = (priority: number) => rule({ id: 'b', name: 'Peak', priceModifier: 2, priority });

      // fee first: (50 + 10) x 2 = 120      peak first: 50 x 2 + 10 = 110
      expect(quote({ rules: [plusTen(5), double(1)] }).breakdown[0]).toMatchObject({ rate: 120, description: 'Fee + Peak' });
      expect(quote({ rules: [plusTen(1), double(5)] }).breakdown[0]).toMatchObject({ rate: 110, description: 'Peak + Fee' });
    });

    it('gives the same answer however the rules are listed', () => {
      const rules = [rule({ id: 'a', priceModifier: 1.5, priority: 2 }), rule({ id: 'b', modifierType: 'fixed', priceModifier: 4, priority: 2 })];

      expect(quote({ rules }).totalAmount).toBe(quote({ rules: [...rules].reverse() }).totalAmount);
    });

    it('can limit a rule to days of the week', () => {
      // Fri=5, Sat=6, Sun=0. 2030-06-07 is a Friday: nights Fri, Sat, Sun
      const q = quote({
        start: d('2030-06-07'),
        end: d('2030-06-10'),
        rules: [rule({ name: 'Weekend', priceModifier: 1.5, daysOfWeek: [5, 6] })],
      });

      expect(q.breakdown.map((n) => n.rate)).toEqual([75, 75, 50]);
    });

    it('can limit a rule to stays of a minimum or maximum length', () => {
      const longStay = rule({ name: 'Long stay', modifierType: 'percentage', priceModifier: -10, minStay: 3 });
      const shortStay = rule({ name: 'Short stay', modifierType: 'fixed', priceModifier: 5, maxStay: 2 });

      expect(quote({ rules: [longStay] }).breakdown[0]!.rate).toBe(45); // 3 nights qualifies
      expect(quote({ rules: [longStay], end: d('2030-06-05') }).breakdown[0]!.rate).toBe(50); // 2 nights does not
      expect(quote({ rules: [shortStay] }).breakdown[0]!.rate).toBe(50); // 3 nights is too long
      expect(quote({ rules: [shortStay], end: d('2030-06-05') }).breakdown[0]!.rate).toBe(55);
    });

    it('can limit a rule to certain site types', () => {
      const rvOnly = rule({ siteTypes: ['RV'], priceModifier: 2 });

      expect(quote({ rules: [rvOnly] }).subtotal).toBe(150); // tent: unaffected
      expect(quote({ rules: [rvOnly], site: { type: 'RV', basePrice: 50 } }).subtotal).toBe(300);
      expect(quote({ rules: [rule({ siteTypes: [], priceModifier: 2 })] }).subtotal).toBe(300); // empty = all types
    });

    it('never lets a night cost less than nothing', () => {
      const q = quote({ rules: [rule({ modifierType: 'fixed', priceModifier: -500 })] });

      expect(q.breakdown.every((n) => n.rate === 0)).toBe(true);
      expect(q.totalAmount).toBe(0);
    });

    it('ignores a rule with an unknown modifier type rather than corrupting the price', () => {
      expect(quote({ rules: [rule({ modifierType: 'bogus', priceModifier: 99 })] }).subtotal).toBe(150);
    });
  });

  describe('equipment and discounts', () => {
    const tents = { equipmentId: 'e1', name: 'Tent', dailyRate: 15, quantity: 2 };

    it('charges daily rate x quantity x nights, and taxes it with the stay', () => {
      const q = quote({ equipment: [tents] });

      expect(q.equipment).toEqual([{ equipmentId: 'e1', name: 'Tent', quantity: 2, dailyRate: 15, totalAmount: 90 }]);
      expect(q).toMatchObject({ subtotal: 150, equipmentTotal: 90, taxAmount: 19.2, totalAmount: 259.2 });
    });

    it('takes a discount off before tax, and never more than the charges', () => {
      expect(quote({ discountAmount: 50 })).toMatchObject({ discountAmount: 50, taxAmount: 8, totalAmount: 108 });
      expect(quote({ discountAmount: 9999 })).toMatchObject({ discountAmount: 150, taxAmount: 0, totalAmount: 0 });
      expect(quote({ discountAmount: -20 }).discountAmount).toBe(0);
    });
  });

  describe('invariants', () => {
    it('always adds up: nights, subtotal and total match the lines shown', () => {
      let seed = 42;
      const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

      for (let run = 0; run < 300; run++) {
        const nights = 1 + Math.floor(rand() * 20);
        const rules = Array.from({ length: Math.floor(rand() * 4) }, (_, i) =>
          rule({
            id: `r${i}`,
            modifierType: ['multiplier', 'percentage', 'fixed'][Math.floor(rand() * 3)]!,
            priceModifier: rand() * 3 - 0.5,
            priority: Math.floor(rand() * 5),
            daysOfWeek: rand() < 0.5 ? [] : [Math.floor(rand() * 7)],
          })
        );
        const q = quote({
          site: { type: 'TENT', basePrice: Math.round(rand() * 20000) / 100 },
          end: new Date(d('2030-06-03').getTime() + nights * 86_400_000),
          rules,
          taxRate: rand() * 0.2,
          equipment: [{ equipmentId: 'e', dailyRate: Math.round(rand() * 5000) / 100, quantity: 1 + Math.floor(rand() * 4) }],
          discountAmount: rand() < 0.5 ? 0 : rand() * 50,
        });

        const cents = (n: number) => Math.round(n * 100);
        expect(q.nights).toBe(nights);
        expect(q.breakdown).toHaveLength(nights);
        expect(cents(q.subtotal)).toBe(q.breakdown.reduce((s, n) => s + cents(n.rate), 0));
        expect(cents(q.totalAmount)).toBe(cents(q.subtotal) + cents(q.equipmentTotal) - cents(q.discountAmount) + cents(q.taxAmount));
        expect(q.breakdown.every((n) => n.rate >= 0)).toBe(true);
        expect(q.totalAmount).toBeGreaterThanOrEqual(0);
        expect(q.depositAmount).toBeLessThanOrEqual(q.totalAmount);
      }
    });
  });
});

describe('mergeEquipmentRequests', () => {
  it('combines repeated items into one line', () => {
    expect(
      mergeEquipmentRequests([
        { equipmentId: 'e1', quantity: 1 },
        { equipmentId: 'e2', quantity: 2 },
        { equipmentId: 'e1', quantity: 3 },
      ])
    ).toEqual([
      { equipmentId: 'e1', quantity: 4 },
      { equipmentId: 'e2', quantity: 2 },
    ]);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects a quantity of %s', (quantity) => {
    expect(() => mergeEquipmentRequests([{ equipmentId: 'e1', quantity }])).toThrowError(expect.objectContaining({ statusCode: 400 }));
  });

  it('accepts no equipment', () => {
    expect(mergeEquipmentRequests()).toEqual([]);
  });
});
