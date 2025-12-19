import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBookings() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      site: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });

  console.log('Total bookings in DB:', bookings.length);
  console.log('\nBooking details:');
  bookings.forEach(booking => {
    console.log(`${booking.bookingNumber}: ${booking.checkInDate.toISOString()} - ${booking.checkOutDate.toISOString()} [${booking.status}]`);
  });

  await prisma.$disconnect();
}

testBookings();
