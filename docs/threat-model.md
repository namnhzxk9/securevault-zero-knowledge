# Threat Model

## Assets

- Master password
- Derived encryption key
- Secret notes
- API keys
- Encrypted vault items
- Vault metadata

## Trust Boundaries

- Browser memory: trusted only during an active unlocked session
- IndexedDB: untrusted local storage
- LocalStorage: untrusted local storage
- Network: not used in the current MVP

## Threats and Mitigations

### T1: Local storage compromise

An attacker obtains local browser storage, including IndexedDB data.

Mitigation:

- Secrets are encrypted before storage.
- AES-GCM is used for authenticated encryption.
- Plaintext values are never persisted.

### T2: Weak master password

An attacker attempts to brute-force the vault.

Mitigation:

- Minimum password length is enforced.
- PBKDF2 is used for key derivation.
- Stronger password policy is planned.

### T3: Session left unlocked

A user leaves the vault open on a shared or unattended machine.

Mitigation:

- Manual lock is available.
- Auto-lock after inactivity is planned.

### T4: Sensitive data leakage through logs

Secrets may leak through console logs, debug messages, or audit logs.

Mitigation:

- Plaintext secrets are not logged.
- Audit logs should store actions only, not secret content.

### T5: Malicious browser extension or compromised device

A malicious extension or compromised endpoint reads plaintext while the vault is unlocked.

Mitigation:

- Out of scope for the current MVP.
- Users should only unlock the vault on trusted devices.