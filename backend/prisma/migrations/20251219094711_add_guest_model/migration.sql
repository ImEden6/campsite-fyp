-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('ADULT', 'CHILD');

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "type" "GuestType" NOT NULL DEFAULT 'ADULT',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guests_bookingId_idx" ON "guests"("bookingId");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "unique_primary_guest" ON "guests"("bookingId") WHERE "isPrimary" = true;
