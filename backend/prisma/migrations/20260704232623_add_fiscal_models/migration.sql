-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "company_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "control_number" TEXT NOT NULL,
    "rif" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "iva_rate" DECIMAL(5,2) NOT NULL DEFAULT 16.00,
    "iva_amount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "iva_withholding_rate" DECIMAL(5,2),
    "iva_withheld" DECIMAL(18,2),
    "retention_voucher_number" TEXT,
    "retention_date" TIMESTAMP(3),
    "islr_withholding_rate" DECIMAL(5,2),
    "islr_withheld" DECIMAL(18,2),
    "company_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_entries_company_id_idx" ON "journal_entries"("company_id");

-- CreateIndex
CREATE INDEX "journal_entries_tenant_id_idx" ON "journal_entries"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_company_id_number_key" ON "journal_entries"("company_id", "number");

-- CreateIndex
CREATE INDEX "journal_entry_lines_entry_id_idx" ON "journal_entry_lines"("entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_account_id_idx" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "tax_documents_company_id_idx" ON "tax_documents"("company_id");

-- CreateIndex
CREATE INDEX "tax_documents_tenant_id_idx" ON "tax_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_documents_journal_entry_id_idx" ON "tax_documents"("journal_entry_id");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounting_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
