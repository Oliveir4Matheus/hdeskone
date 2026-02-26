-- AlterTable
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- Existing admin user should not be forced to change password
UPDATE "User" SET "mustChangePassword" = false WHERE "role" = 'admin';
