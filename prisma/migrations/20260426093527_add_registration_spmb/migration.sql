-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'DITERIMA', 'DITOLAK');

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "isOpenForRegistration" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "ttl" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "asalSekolah" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_departmentId_idx" ON "Registration"("departmentId");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
