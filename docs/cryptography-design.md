# Cryptography Design

## Overview

SecureVault uses client-side encryption to protect sensitive data before it is stored locally.

The application does not store:

- Master password
- Derived encryption key
- Plaintext secret values

## Key Derivation

The encryption key is derived from the user's master password using PBKDF2.

Parameters:

- Algorithm: PBKDF2
- Hash: SHA-256
- Iterations: 250,000
- Salt: persistent random vault salt
- Output key: AES-GCM 256-bit key

## Encryption

Vault items are encrypted using AES-GCM.

Parameters:

- Algorithm: AES-GCM
- Key length: 256 bits
- IV length: 96 bits / 12 bytes
- IV generation: random per encryption operation

## Storage

Encrypted vault items are stored in IndexedDB.

Each vault item stores:

- ID
- Title
- Ciphertext
- IV
- Creation timestamp

The vault salt is stored separately in LocalStorage.

## Security Notes

AES-GCM provides both confidentiality and integrity. If the ciphertext is modified, decryption fails.

The current MVP uses PBKDF2 because it is available through the Web Crypto API. A future version may replace or supplement PBKDF2 with Argon2id for stronger password-based key derivation.

## Limitations

This project has not undergone third-party security audit.

The current MVP does not protect against:

- Compromised devices
- Malicious browser extensions
- XSS attacks
- Weak user-selected master passwords