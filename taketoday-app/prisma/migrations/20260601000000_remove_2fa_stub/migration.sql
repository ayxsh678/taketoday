-- Remove 2FA stub fields [SEC-02 / BUG-04]
-- These columns backed a non-functional TOTP stub that was never implemented.
-- Proper TOTP 2FA (RFC 6238) is tracked in SECURITY_ROADMAP.md.

ALTER TABLE "AdminUser" DROP COLUMN "twoFactorReady";

ALTER TABLE "PublicUser" DROP COLUMN "twoFactorEnabled";
ALTER TABLE "PublicUser" DROP COLUMN "twoFactorSecret";
