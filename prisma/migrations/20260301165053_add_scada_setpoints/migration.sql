-- CreateTable
CREATE TABLE "ScadaSetpoint" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScadaSetpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScadaSetpoint_unitId_tagId_key" ON "ScadaSetpoint"("unitId", "tagId");
