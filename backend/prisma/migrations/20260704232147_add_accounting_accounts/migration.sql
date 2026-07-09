-- CreateTable
CREATE TABLE "accounting_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "is_transactional" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "company_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_accounts_company_id_idx" ON "accounting_accounts"("company_id");

-- CreateIndex
CREATE INDEX "accounting_accounts_tenant_id_idx" ON "accounting_accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_company_id_code_key" ON "accounting_accounts"("company_id", "code");

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounting_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
