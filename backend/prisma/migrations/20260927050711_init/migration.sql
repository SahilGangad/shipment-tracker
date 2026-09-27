-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('BOOKED', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "expected_delivery_date" TIMESTAMP(3) NOT NULL,
    "current_status" "ShipmentStatus" NOT NULL DEFAULT 'BOOKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "location" TEXT,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_reference_number_key" ON "shipments"("reference_number");

-- CreateIndex
CREATE INDEX "shipments_current_status_idx" ON "shipments"("current_status");

-- CreateIndex
CREATE INDEX "shipments_reference_number_idx" ON "shipments"("reference_number");

-- CreateIndex
CREATE INDEX "status_history_shipment_id_idx" ON "status_history"("shipment_id");

-- CreateIndex
CREATE INDEX "status_history_changed_at_idx" ON "status_history"("changed_at");

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
