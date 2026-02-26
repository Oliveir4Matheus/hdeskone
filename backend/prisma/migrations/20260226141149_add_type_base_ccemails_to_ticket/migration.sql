-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "base" TEXT NOT NULL DEFAULT 'GRU',
ADD COLUMN     "ccEmails" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'incidente';

-- CreateIndex
CREATE INDEX "Ticket_type_idx" ON "Ticket"("type");

-- CreateIndex
CREATE INDEX "Ticket_base_idx" ON "Ticket"("base");
