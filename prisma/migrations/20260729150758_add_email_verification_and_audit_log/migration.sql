-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ACCOUNT_CREATED', 'EMAIL_VERIFIED', 'EMAIL_CHANGE_REQUESTED', 'EMAIL_CHANGED', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'PROJECT_CREATED', 'PROJECT_DELETED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- Reprise des comptes existants.
--
-- La connexion exige desormais une adresse confirmee. Sans cette ligne, tous
-- les comptes crees avant la migration se retrouveraient verrouilles du jour
-- au lendemain, pour ne pas avoir respecte une regle qui n'existait pas.
--
-- On date la verification de la creation du compte plutot que de maintenant :
-- c'est une reprise d'historique, pas un evenement d'aujourd'hui, et une
-- lecture ulterieure du journal ne doit pas croire que 400 comptes ont
-- confirme leur adresse a la meme seconde.
UPDATE "users" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT,
    "metadata" JSONB,
    "ip" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
