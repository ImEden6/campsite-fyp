# Pricing

One engine ([`backend/src/services/pricing.service.ts`](../../backend/src/services/pricing.service.ts)) prices a stay.
It is used to **quote** a price (`POST /api/v1/bookings/calculate-price`) and to **charge** it when a booking is
created or its dates change, so the price a customer sees is the price they are charged.

## How a price is built

| Step | Rule |
|------|------|
| Nights | `ceil((check-out - check-in) / 24h)`. Each night is dated by the UTC day it starts. |
| Nightly rate | The site's `basePrice`, then every applicable pricing rule applied in turn (below). Never below 0. |
| Subtotal | Sum of the nightly rates. |
| Equipment | `dailyRate x quantity x nights` per item. Rates are fixed when the equipment is reserved. |
| Discount | Taken off before tax; never more than the charges. (No discount source exists yet, so this is 0.) |
| Tax | `(subtotal + equipment - discount) x taxRate` |
| Total | `subtotal + equipment - discount + tax` |
| Deposit | `total x depositPercentage / 100` (informational) |

Everything is rounded to cents at each step, so the lines shown always add up to the total.

`taxRate` and `depositPercentage` come from the newest `CampsiteSettings` row, falling back to
`DEFAULT_TAX_RATE` (0.08) and `DEFAULT_DEPOSIT_PERCENTAGE` (25).

## Pricing rules (`PricingRule`)

A rule applies to a night when **all** of these hold:

- it is active;
- its `siteTypes` is empty (all types) or includes the site's type;
- the night's date is between `startDate` and `endDate`, both included;
- its `daysOfWeek` is empty (every day) or includes the night's weekday (0 = Sunday ... 6 = Saturday);
- the stay's length is within `minStay` / `maxStay` (when set).

**All applicable rules stack**, highest `priority` first (ties: oldest first), each one changing the running rate:

| `modifierType` | Effect on the rate |
|----------------|--------------------|
| `multiplier` | `rate x priceModifier` (1.5 = 150%) |
| `percentage` | `rate x (1 + priceModifier / 100)` (20 = +20%, -10 = -10%) |
| `fixed` | `rate + priceModifier` |

Because they stack, order matters: with a base of 50, "+10 fixed" applied before "x2" gives 120; after it gives 110.
An unrecognised `modifierType` is ignored rather than allowed to change a price.

## Equipment on a booking

Equipment is reserved together with the booking (`EquipmentReservation`). The equipment rows are locked while
availability is checked, so two bookings racing for the last unit are handled one after the other. Reservations are
released (status `CANCELLED`) when the booking is cancelled or expires unpaid, and move with the stay when its dates change.

## Endpoint

`POST /api/v1/bookings/calculate-price` (public)

```json
{ "siteId": "...", "checkInDate": "2030-06-03", "checkOutDate": "2030-06-06",
  "equipmentReservations": [{ "equipmentId": "...", "quantity": 2 }] }
```

Returns `basePrice, nights, subtotal, equipmentTotal, discountAmount, taxAmount, totalAmount, depositAmount`,
a per-night `breakdown` (`date, rate, description`) and the priced `equipment` lines.
