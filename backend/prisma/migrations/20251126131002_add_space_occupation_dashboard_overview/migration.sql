-- CreateEnum
CREATE TYPE "SpaceOccupationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "SpaceOccupation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "appointmentId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedEndAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "SpaceOccupationStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "SpaceOccupation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceOccupation_companyId_startedAt_idx" ON "SpaceOccupation"("companyId", "startedAt");

-- AddForeignKey
ALTER TABLE "SpaceOccupation" ADD CONSTRAINT "SpaceOccupation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceOccupation" ADD CONSTRAINT "SpaceOccupation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceOccupation" ADD CONSTRAINT "SpaceOccupation_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceOccupation" ADD CONSTRAINT "SpaceOccupation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
