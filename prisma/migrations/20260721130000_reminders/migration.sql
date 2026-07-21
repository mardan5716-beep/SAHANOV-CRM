-- CreateTable: напоминания «связаться с клиентом»
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reminder_clientId_idx" ON "Reminder"("clientId");
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");
CREATE INDEX "Reminder_deletedAt_idx" ON "Reminder"("deletedAt");

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
