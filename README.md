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

## Install as an app (no browser bar)
- **Android (Chrome):** tap **Install** in the in-app banner, or Settings > Install as an app, or browser menu > Install app. It opens full screen from its own icon.
- **iPhone:** open in Safari, tap Share > Add to Home Screen.
- **Real Android app file (APK) / Play Store:** use https://www.pwabuilder.com with your site address, choose Package for stores > Android, and generate. Install the `.apk` on phones, or upload the `.aab` to Google Play (one-time developer fee). Put the generated `assetlinks.json` in the project root (next to `server.js`). The server publishes it at `/.well-known/assetlinks.json`, which removes the address bar inside the app. Keep the signing key from the download safe: you need it for every update.

## Push notifications (messages, calls and missed calls when the app is closed)
Uses the standard Web Push protocol, so no third-party account is needed. Set these on the server:
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: a key pair for your server. Generate your own with `npx web-push generate-vapid-keys`.
- `VAPID_SUBJECT`: your site address (for example `https://your-app.onrender.com`) or a `mailto:` address.

Then each user turns it on in Settings > Notifications (or from the banner). Notes:
- The site must be served over HTTPS (Render does this).
- Chrome, Edge, Firefox and Samsung Internet on Android and desktop work in the browser. On iPhone (iOS 16.4 or later) the app must first be added to the Home Screen.
- Notification text is end-to-end encrypted between the server and the device, but it still passes through the browser vendor's push service. Users can turn off "Show message text in notifications" so only "New message" is sent.
- If the person being called has the app closed, the call rings through a push notification. They have about 45 seconds to open it and answer.
- Without the keys, push stays off and the rest of the app works normally.

## Call history
The **Calls** tab lists incoming, outgoing, missed, declined and unanswered calls with the contact, time and duration. Tap a row to call that person back (voice or video as before). A red badge counts missed calls you have not seen, and a browser notification appears for a missed call while the tab is in the background. "Clear all" removes the list for you only. Calls are recorded by the server when they ring, connect or end.

## Themes, QR, verification, AI and message tools
- **Themes and wallpapers:** Settings (gear) > Themes & chat wallpaper. Five themes, preset wallpapers or your own photo. Saved to your account.
- **QR code:** Settings > My QR code shows a code that opens PHANTOM LINK and starts a chat with you. Settings > Scan a QR code scans in supported browsers (Chrome on Android); on iPhone use the Camera app.
- **Verified accounts:** set `ADMIN_NUMBERS` (comma-separated app numbers). Admins can verify or unverify accounts from Settings > Verify an account, or from a contact's profile card. Verified users show a check badge.
- **Message tools:** tap the dots on a message for reactions, reply, copy, forward (up to 5 chats), pin (up to 3 per chat), edit (within 15 minutes) and delete for everyone.
- **AI replies and translation (optional):** set `ANTHROPIC_API_KEY` (and optionally `AI_MODEL`, default `claude-haiku-5-5`). Message text is sent to the AI service only when a user taps Translate or the sparkles button, after a one-time confirmation. Limited to 40 AI requests per user per hour. API usage is billed by the AI provider. Without the key, the AI buttons stay hidden.

## Status updates (24 hours)
Post text, photo or video statuses from the **Status** tab. Contacts (people you share a chat or group with) can view and react to them, and you can see who viewed yours. Statuses are removed automatically after 24 hours, or earlier if you delete them.

## Profiles and calls
- Profile page: tap your avatar (top left) to change photo, name and about. Tap a chat header to see a contact's profile.
- Voice and video calls (WebRTC, signalled over Socket.IO) from the chat header or the contact card.
- Calls need HTTPS (Render provides it) and microphone/camera permission.
- For reliable calls across mobile networks, set a TURN relay on the server: `TURN_URL` (comma-separated, e.g. `turn:host:80,turns:host:443`), `TURN_USER`, `TURN_PASS`. Without TURN, calls use public STUN only and may fail on some carriers.

## Persistent storage (Postgres)
Set `DATABASE_URL` to a Postgres connection string (e.g. a free Neon database) and all accounts, messages and uploaded files are stored there and survive restarts. Without it, the app falls back to a local `data/` folder (fine for development).

## Not included yet (ideas for next steps)
End-to-end encryption, voice/video calls, status/stories, message forwarding/editing, background push notifications, phone-number SMS verification, and a real database (data is stored in `data/db.json`).
