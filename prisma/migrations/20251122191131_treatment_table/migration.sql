-- CreateTable
CREATE TABLE "TreatmentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "groupId" TEXT NOT NULL,
    "basePrice" DECIMAL(65,30) DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentGroup_name_key" ON "TreatmentGroup"("name");

-- CreateIndex
CREATE INDEX "Treatment_groupId_idx" ON "Treatment"("groupId");

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TreatmentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
