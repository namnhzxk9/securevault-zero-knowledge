SecureVault Zero-Knowledge

SecureVault is a browser-based encrypted vault for storing sensitive notes, API keys, passwords, and private data.

All sensitive data is encrypted locally before being stored. Master passwords and plaintext secrets are never persisted.

Live Demo

https://securevault-zero-knowledge.vercel.app

Features

* AES-256-GCM encryption
* PBKDF2 key derivation
* Client-side encryption
* IndexedDB local storage
* Persistent vault salt
* Encrypted secret storage
* Reveal-on-demand decryption
* No plaintext storage

Security Model

SecureVault assumes local storage is untrusted.

Plaintext data exists only during an active unlocked session. All persisted vault items are encrypted before being written to IndexedDB.

Architecture Overview

The application follows a client-side encryption model:

Master Password
→ PBKDF2 Key Derivation
→ AES-GCM Encryption
→ IndexedDB Storage

The encryption key is derived in the browser and is only kept in memory while the vault is unlocked.

Tech Stack

* React
* TypeScript
* Vite
* Web Crypto API
* IndexedDB
* UUID
* Vercel

Documentation

* Threat Model
* Cryptography Design
* Security Policy

Current Status

MVP completed.

Implemented:

* Unlock vault with master password
* Derive encryption key locally
* Encrypt secret values before storage
* Store encrypted items in IndexedDB
* Reveal secrets on demand
* Lock vault manually

Planned improvements:

* Auto-lock after inactivity
* Password strength meter
* Encrypted vault export/import
* Clipboard auto-clear
* Additional unit tests
* Argon2id key derivation option

Security Disclaimer

This project is for educational and portfolio purposes.

It has not undergone a professional third-party security audit and should not be used to store production secrets without further security review.