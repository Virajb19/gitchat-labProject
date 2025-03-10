-- CreateTable
CREATE TABLE "StripeTransaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "credits" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "StripeTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StripeTransaction" ADD CONSTRAINT "StripeTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
