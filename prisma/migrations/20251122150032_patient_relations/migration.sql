/*
  Warnings:

  - You are about to drop the column `clinicId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `medicalCenterId` on the `Patient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_medicalCenterId_fkey";

-- DropIndex
DROP INDEX "Patient_clinicId_createdAt_idx";

-- DropIndex
DROP INDEX "Patient_clinicId_idx";

-- DropIndex
DROP INDEX "Patient_medicalCenterId_createdAt_idx";

-- DropIndex
DROP INDEX "Patient_medicalCenterId_idx";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "clinicId",
DROP COLUMN "medicalCenterId";

-- CreateTable
CREATE TABLE "_PatientClinics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PatientClinics_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PatientMedicalCenters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PatientMedicalCenters_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PatientClinics_B_index" ON "_PatientClinics"("B");

-- CreateIndex
CREATE INDEX "_PatientMedicalCenters_B_index" ON "_PatientMedicalCenters"("B");

-- AddForeignKey
ALTER TABLE "_PatientClinics" ADD CONSTRAINT "_PatientClinics_A_fkey" FOREIGN KEY ("A") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientClinics" ADD CONSTRAINT "_PatientClinics_B_fkey" FOREIGN KEY ("B") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientMedicalCenters" ADD CONSTRAINT "_PatientMedicalCenters_A_fkey" FOREIGN KEY ("A") REFERENCES "MedicalCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatientMedicalCenters" ADD CONSTRAINT "_PatientMedicalCenters_B_fkey" FOREIGN KEY ("B") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
