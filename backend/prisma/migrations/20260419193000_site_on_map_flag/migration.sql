-- AlterTable
ALTER TABLE "sites" ADD COLUMN "onMap" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "sites_onMap_idx" ON "sites"("onMap");
