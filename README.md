# OWL BUG

A production-ready OWL BUG WhatsApp pairing website built around the existing Baileys session architecture.

## Features

- real WhatsApp pairing flow using Baileys `requestPairingCode(phoneNumber)`
- isolated session directories per user under `sessions/`
- live connection state from the underlying Baileys connection
- secure Express server with session cookies, CSRF protection, and rate limiting
- admin dashboard with safe session monitoring and disconnect controls
- configurable UI menu and branding

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies:
   npm install
3. Start the app:
   npm start
4. Open http://localhost:3000

## Important notes

- This project is designed as a wrapper around an existing Baileys bot architecture.
- It preserves a per-user session directory model and does not expose credentials to the browser.
- The app uses `useMultiFileAuthState()` and `requestPairingCode()` directly from Baileys when a new pairing session is created.

## Admin access

Set `ADMIN_TOKEN` in `.env` and log in from the admin page with the same token.
