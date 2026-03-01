-- CreateEnum
CREATE TYPE "ConnectorProtocol" AS ENUM ('OPC_UA', 'MODBUS_TCP', 'S7');

-- CreateTable
CREATE TABLE "ConnectorEndpoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" "ConnectorProtocol" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "siteId" TEXT NOT NULL,
    "areaId" TEXT,
    "lineId" TEXT,
    "equipmentId" TEXT,
    "config" JSONB NOT NULL,
    "pollingInterval" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorTag" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "mqttTopic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" TEXT,
    "writable" BOOLEAN NOT NULL DEFAULT false,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeConfig" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BridgeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorTag_endpointId_sourceId_key" ON "ConnectorTag"("endpointId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeConfig_type_key" ON "BridgeConfig"("type");

-- AddForeignKey
ALTER TABLE "ConnectorEndpoint" ADD CONSTRAINT "ConnectorEndpoint_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorEndpoint" ADD CONSTRAINT "ConnectorEndpoint_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorEndpoint" ADD CONSTRAINT "ConnectorEndpoint_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorEndpoint" ADD CONSTRAINT "ConnectorEndpoint_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorTag" ADD CONSTRAINT "ConnectorTag_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "ConnectorEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
