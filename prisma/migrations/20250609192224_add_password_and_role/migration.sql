-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordResetExpires" TEXT,
ADD COLUMN     "passwordResetToken" TEXT;
