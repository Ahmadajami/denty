-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "fullnameAr" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "clinicId" TEXT,
    "medicalCenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_phoneNumber_key" ON "Patient"("phoneNumber");

-- CreateIndex
CREATE INDEX "Patient_clinicId_idx" ON "Patient"("clinicId");

-- CreateIndex
CREATE INDEX "Patient_medicalCenterId_idx" ON "Patient"("medicalCenterId");

-- CreateIndex
CREATE INDEX "Patient_clinicId_createdAt_idx" ON "Patient"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "Patient_medicalCenterId_createdAt_idx" ON "Patient"("medicalCenterId", "createdAt");

-- CreateIndex
CREATE INDEX "Patient_phoneNumber_idx" ON "Patient"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_medicalCenterId_fkey" FOREIGN KEY ("medicalCenterId") REFERENCES "MedicalCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
