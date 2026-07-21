-- AlterTable: защита от подбора пароля (rate-limit входа)
ALTER TABLE "Manager"
  ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);
