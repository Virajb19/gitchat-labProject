/*
  Warnings:

  - Changed the type of `identifier` on the `VerificationToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "identifier",
ADD COLUMN     "identifier" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_identifier_key" ON "VerificationToken"("token", "identifier");
