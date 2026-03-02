-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('KWH', 'KW', 'POWER_FACTOR');

-- CreateTable
CREATE TABLE "EnergyMeter" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "meterType" "MeterType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyMeter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnergyMeter_tagId_key" ON "EnergyMeter"("tagId");

-- AddForeignKey
ALTER TABLE "EnergyMeter" ADD CONSTRAINT "EnergyMeter_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ConnectorTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
