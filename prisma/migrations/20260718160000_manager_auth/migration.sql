-- AlterTable: поля для входа менеджеров
ALTER TABLE "Manager"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: уникальный email
CREATE UNIQUE INDEX "Manager_email_key" ON "Manager"("email");
