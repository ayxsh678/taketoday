# Security Roadmap

## TOTP Two-Factor Authentication (RFC 6238)

**Status:** Not implemented. Stub removed in commit `fix(auth): remove 2FA stub [SEC-02 / BUG-04]`.  
**Priority:** High — implement before expanding the admin team beyond founders.

### Scope

Two-factor authentication for **admin accounts** (`AdminUser`) is the primary requirement. Contributor TOTP is lower priority and should reuse the same infrastructure once admin 2FA is proven.

### Requirements

**Enrollment**
- Admin initiates enrollment from a new `/admin/settings/security` page (authenticated, requires `settings:manage` permission).
- Generate a TOTP secret using `otplib` (`authenticator.generateSecret()`).
- Display a QR code (use `qrcode` package) encoding an `otpauth://` URI so any RFC 6238 app (Google Authenticator, Authy, 1Password) can scan it.
- Require the user to confirm a valid OTP code before storing the secret — prevents lockout from misconfigured enrolment.
- Store the encrypted secret in a new `AdminUser.totpSecret` column (encrypt at rest; use `SECRET_KEY` + AES-256-GCM via Node `crypto`, never store plaintext).
- Generate 10 single-use recovery codes (16 random hex chars each), bcrypt-hash each one, store as `AdminUser.totpRecoveryCodes String[]`.
- Show recovery codes once at enrollment; user must acknowledge. Never display again.

**Verification**
- After a successful Google OAuth callback, if `AdminUser.totpEnabled = true`, set a short-lived `totp_pending` flag in the JWT (e.g., 5-minute window) and redirect to `/admin/verify-2fa`.
- `/admin/verify-2fa` accepts a 6-digit OTP or a recovery code.
- On success: set `twoFaVerified = true` in the JWT, clear `totp_pending`, redirect to original destination.
- On failure: increment a per-user failure counter (store in Redis / DB). Lock after 5 failures for 15 minutes.
- The protected layout checks `session.user.twoFaVerified` before rendering. Middleware enforces it at the edge.

**Recovery codes**
- Each code is single-use. Hash stored in DB; plaintext never persisted.
- Using a recovery code marks it consumed and flags the account for re-enrollment prompt.
- Regenerate codes from the security settings page (invalidates all existing codes).

**Device trust (optional, post-MVP)**
- After successful 2FA, optionally issue a 30-day "trusted device" cookie (signed, httpOnly, sameSite=strict).
- Trusted devices skip the TOTP step for the cookie lifetime.
- Device management UI: list trusted devices, revoke individual or all.

### Schema additions (when implementing)

```prisma
model AdminUser {
  // ... existing fields ...
  totpEnabled       Boolean   @default(false)
  totpSecret        String?   // AES-256-GCM encrypted; null until enrollment
  totpRecoveryCodes String[]  // bcrypt-hashed single-use codes
  totpEnrolledAt    DateTime?
  totpFailures      Int       @default(0)
  totpLockedUntil   DateTime?
}
```

### Key packages

| Package | Purpose |
|---|---|
| `otplib` | RFC 6238 TOTP generation and verification |
| `qrcode` | QR code generation for enrollment |
| Node `crypto` | AES-256-GCM secret encryption |
| `bcryptjs` | Recovery code hashing |

### Security constraints

- TOTP window: ±1 step (30 s each side) to tolerate clock skew. Do not widen further.
- Secrets encrypted at rest; decrypted only during verification, never logged.
- Rate-limit the verification endpoint: 5 attempts per 15 minutes per user (durable Redis counter — not in-memory).
- Recovery codes are one-time; consuming all 10 requires a support-assisted re-enrollment.
- Do not accept the same OTP twice within the same 30 s window (replay prevention via Redis `SET NX EX 30`).
- TOTP enrollment and recovery code regeneration require re-authentication (fresh Google OAuth within last 5 min).
- Log all 2FA events (enrollment, verification, failure, recovery-code use, lockout) to `AuditLog`.

### Rollout sequence

1. Implement enrollment UI and secret storage (behind feature flag `TOTP_ENROLLMENT_ENABLED`).
2. Implement verification flow and JWT `twoFaVerified` gate.
3. Test with one super-admin account; confirm recovery-code path works.
4. Enable `TOTP_REQUIRED=true` for all admins; give 2-week enrollment grace period.
5. After grace period, enforce: non-enrolled admins see enrollment page instead of admin panel.
6. Remove feature flag; 2FA is mandatory.

### Not in scope for initial implementation

- WebAuthn / passkeys (evaluate as replacement after TOTP is stable)
- SMS OTP (avoid — SIM-swap vulnerable)
- Contributor-account 2FA (reuse the same `otplib` infrastructure; add `PublicUser.totpEnabled` etc. in a follow-up)
