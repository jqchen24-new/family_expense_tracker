-- DropIndex
DROP INDEX "Account_plaid_item_id_key";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN "plaid_account_id" TEXT;
