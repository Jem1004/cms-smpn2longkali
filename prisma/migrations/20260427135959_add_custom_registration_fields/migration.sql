-- CreateEnum
CREATE TYPE "RegistrationFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'DATE');

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "customData" JSONB;

-- CreateTable
CREATE TABLE "RegistrationField" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RegistrationFieldType" NOT NULL DEFAULT 'TEXT',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationField_order_idx" ON "RegistrationField"("order");
