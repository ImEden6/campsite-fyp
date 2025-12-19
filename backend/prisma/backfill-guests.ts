
import { PrismaClient, GuestType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backfill of guests for existing bookings...');

    // 1. Fetch all bookings that have no guests
    // We check this by including guests count or doing a raw query.
    // For simplicity with Prisma API:
    const bookings = await prisma.booking.findMany({
        include: {
            _count: {
                select: { guests: true }
            }
        }
    });

    const bookingsToBackfill = bookings.filter(b => b._count.guests === 0);
    console.log(`Found ${bookingsToBackfill.length} bookings to backfill.`);

    let backfilledCount = 0;

    for (const booking of bookingsToBackfill) {
        const { adultGuests, childGuests, id: bookingId } = booking;
        const totalGuests = adultGuests + childGuests;

        if (totalGuests === 0) {
            console.warn(`Booking ${bookingId} has 0 guests. Skipping.`);
            continue;
        }

        console.log(`Backfilling Booking ${bookingId}: ${adultGuests} Adults, ${childGuests} Children`);

        // Create transaction for this booking
        await prisma.$transaction(async (tx) => {
            let guestCount = 1;
            let primaryAssigned = false;

            // Create Adults
            for (let i = 0; i < adultGuests; i++) {
                await tx.guest.create({
                    data: {
                        bookingId: bookingId,
                        firstName: `Guest ${guestCount}`,
                        lastName: '(Adult)',
                        type: GuestType.ADULT,
                        isPrimary: !primaryAssigned, // First adult is primary
                    }
                });
                if (!primaryAssigned) primaryAssigned = true;
                guestCount++;
            }

            // Create Children
            for (let i = 0; i < childGuests; i++) {
                await tx.guest.create({
                    data: {
                        bookingId: bookingId,
                        firstName: `Guest ${guestCount}`,
                        lastName: '(Child)',
                        type: GuestType.CHILD,
                        isPrimary: false, // Children never primary
                    }
                });
                guestCount++;
            }
        });

        backfilledCount++;
    }

    console.log(`Successfully backfilled ${backfilledCount} bookings.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
