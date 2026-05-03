-- CreateEnum
CREATE TYPE "GraduationStatus" AS ENUM ('LULUS', 'TIDAK_LULUS');

-- CreateTable
CREATE TABLE "GraduationStudent" (
    "id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "jurusan" TEXT NOT NULL,
    "status" "GraduationStatus" NOT NULL DEFAULT 'LULUS',
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraduationStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraduationStudent_nis_idx" ON "GraduationStudent"("nis");

-- CreateIndex
CREATE INDEX "GraduationStudent_nisn_idx" ON "GraduationStudent"("nisn");

-- CreateIndex
CREATE INDEX "GraduationStudent_tahunAjaran_idx" ON "GraduationStudent"("tahunAjaran");
