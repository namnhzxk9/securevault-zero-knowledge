# SecureVault Zero-Knowledge

SecureVault is a browser-based encrypted vault for storing sensitive notes, API keys, passwords, and private data.

All sensitive data is encrypted locally before being stored. Master passwords and plaintext secrets are never persisted.

## Features

- AES-256-GCM encryption
- PBKDF2 key derivation
- Client-side encryption
- IndexedDB local storage
- Persistent vault salt
- Encrypted secret storage
- Reveal-on-demand decryption
- No plaintext storage

## Security Model

SecureVault assumes local storage is untrusted.

Plaintext data exists only during an active unlocked session. All persisted vault items are encrypted before being written to IndexedDB.

## Tech Stack

- React
- TypeScript
- Vite
- Web Crypto API
- IndexedDB
- UUID

## Current Status

MVP completed.

## Disclaimer

This project is for educational and portfolio purposes. It has not undergone a third-party security audit.