/*
  Warnings:

  - You are about to drop the column `availableQuantity` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `condition` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `equipmentId` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `returnedAt` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `equipment_rentals` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `equipment_rentals` table. All the data in the column will be lost.
  - Added the required column `reservationId` to the `equipment_rentals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EquipmentItemStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'REPAIR', 'LOST', 'RETIRED');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'FULFILLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('INSPECTION', 'CLEANING', 'REPAIR', 'ROUTINE_SERVICE');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EquipmentCategory" ADD VALUE 'WATER_SPORTS';
ALTER TYPE "EquipmentCategory" ADD VALUE 'WINTER_SPORTS';
ALTER TYPE "EquipmentCategory" ADD VALUE 'ELECTRONICS';
ALTER TYPE "EquipmentCategory" ADD VALUE 'COMFORT';

-- DropForeignKey
ALTER TABLE "equipment_rentals" DROP CONSTRAINT "equipment_rentals_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "equipment_rentals" DROP CONSTRAINT "equipment_rentals_equipmentId_fkey";

-- DropIndex
DROP INDEX "equipment_rentals_bookingId_idx";

-- DropIndex
DROP INDEX "equipment_rentals_startDate_endDate_idx";

-- AlterTable
ALTER TABLE "equipment" DROP COLUMN "availableQuantity",
DROP COLUMN "status",
ADD COLUMN     "isSerialized" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "minStockLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modelNumber" TEXT,
ALTER COLUMN "quantity" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "equipment_rentals" DROP COLUMN "condition",
DROP COLUMN "dailyRate",
DROP COLUMN "depositAmount",
DROP COLUMN "endDate",
DROP COLUMN "equipmentId",
DROP COLUMN "quantity",
DROP COLUMN "returnedAt",
DROP COLUMN "startDate",
DROP COLUMN "totalAmount",
ADD COLUMN     "checkoutTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "conditionIn" "EquipmentCondition",
ADD COLUMN     "conditionOut" "EquipmentCondition",
ADD COLUMN     "equipmentItemId" TEXT,
ADD COLUMN     "receivedBy" TEXT,
ADD COLUMN     "rentedBy" TEXT,
ADD COLUMN     "reservationId" TEXT NOT NULL,
ADD COLUMN     "returnTime" TIMESTAMP(3),
ALTER COLUMN "bookingId" DROP NOT NULL;

-- DropEnum
DROP TYPE "EquipmentStatus";

-- CreateTable
CREATE TABLE "equipment_items" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "internalId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" "EquipmentItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_reservations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "dailyRate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "equipmentItemId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "performedBy" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_items_internalId_key" ON "equipment_items"("internalId");

-- CreateIndex
CREATE INDEX "equipment_reservations_bookingId_idx" ON "equipment_reservations"("bookingId");

-- CreateIndex
CREATE INDEX "equipment_reservations_startDate_endDate_idx" ON "equipment_reservations"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "maintenance_logs_equipmentItemId_idx" ON "maintenance_logs"("equipmentItemId");

-- CreateIndex
CREATE INDEX "equipment_rentals_reservationId_idx" ON "equipment_rentals"("reservationId");

-- CreateIndex
CREATE INDEX "equipment_rentals_equipmentItemId_idx" ON "equipment_rentals"("equipmentItemId");

-- AddForeignKey
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservations" ADD CONSTRAINT "equipment_reservations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservations" ADD CONSTRAINT "equipment_reservations_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "equipment_reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "equipment_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_rentals" ADD CONSTRAINT "equipment_rentals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_equipmentItemId_fkey" FOREIGN KEY ("equipmentItemId") REFERENCES "equipment_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
