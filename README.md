<p align="center"><img src="icon-192.png" width="96" alt="PHANTOM LINK logo"></p>

# PHANTOM LINK — Connect without limits.

*One network. Endless connections.* A real-time messenger with a unique number per user.

Real-time chat where every user is **allocated a unique number** at sign-up. Users find and message each other by number.

## Features
- Sign up / log in (bcrypt + JWT); unique number auto-allocated per user
- 1-to-1 chats started by entering someone's number
- Group chats
- Real-time messaging (Socket.IO)
- Message status ticks: sent ✓, delivered ✓✓, read (blue ✓✓)
- Typing indicator, online status, unread counters
- Image and file sharing
- Offline delivery (messages are delivered when the recipient reconnects)
- Voice notes, emoji picker, reply-to-message, delete-for-everyone
- Chat search, profile editing (name/about), last seen, date separators
- Installable PWA (Add to Home Screen) with app icon, offline app shell, desktop notifications
- Automatic dark mode, responsive mobile-friendly UI
- Hardening: login rate limiting, message flood limit, safe file serving

## Run locally
```bash
npm install
npm start          # http://localhost:3000
```
Set `JWT_SECRET` (and optionally `PORT`) as environment variables in production.

## Upload to GitHub
```bash
git init
git add .
git commit -m "Initial commit: PHANTOM LINK"
git branch -M main
git remote add origin https://github.com/<your-username>/chatapp.git
git push -u origin main
```

## Profiles and calls
- Profile page: tap your avatar (top left) to change photo, name and about. Tap a chat header to see a contact's profile.
- Voice and video calls (WebRTC, signalled over Socket.IO) from the chat header or the contact card.
- Calls need HTTPS (Render provides it) and microphone/camera permission.
- For reliable calls across mobile networks, set a TURN relay on the server: `TURN_URL` (comma-separated, e.g. `turn:host:80,turns:host:443`), `TURN_USER`, `TURN_PASS`. Without TURN, calls use public STUN only and may fail on some carriers.

## Persistent storage (Postgres)
Set `DATABASE_URL` to a Postgres connection string (e.g. a free Neon database) and all accounts, messages and uploaded files are stored there and survive restarts. Without it, the app falls back to a local `data/` folder (fine for development).

## Not included yet (ideas for next steps)
End-to-end encryption, voice/video calls, status/stories, message forwarding/editing, background push notifications, phone-number SMS verification, and a real database (data is stored in `data/db.json`).
