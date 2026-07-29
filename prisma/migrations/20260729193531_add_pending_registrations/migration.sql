-- CreateTable
CREATE TABLE "pending_registrations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_tokenHash_key" ON "pending_registrations"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_email_key" ON "pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_expiresAt_idx" ON "pending_registrations"("expiresAt");
