<p align="center"><img src="icon-192.png" width="96" alt="ChatApp logo"></p>

# ChatApp — a WhatsApp-style messenger

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
git commit -m "Initial commit: ChatApp"
git branch -M main
git remote add origin https://github.com/<your-username>/chatapp.git
git push -u origin main
```

## Not included yet (ideas for next steps)
End-to-end encryption, voice/video calls, status/stories, message forwarding/editing, background push notifications, phone-number SMS verification, and a real database (data is stored in `data/db.json`).
