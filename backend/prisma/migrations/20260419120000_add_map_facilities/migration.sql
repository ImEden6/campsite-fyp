-- CreateTable
CREATE TABLE "map_facilities" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL DEFAULT 'main-map',
    "type" TEXT NOT NULL,
    "mapPositionX" DOUBLE PRECISION NOT NULL,
    "mapPositionY" DOUBLE PRECISION NOT NULL,
    "sizeLength" DOUBLE PRECISION NOT NULL,
    "sizeWidth" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "map_facilities_mapId_idx" ON "map_facilities"("mapId");
