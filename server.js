const express = require('express'), http = require('http'), fs = require('fs'), path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), multer = require('multer');

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const DATA = path.join(__dirname, 'data'), DB_FILE = path.join(DATA, 'db.json');
fs.mkdirSync(path.join(DATA, 'uploads'), { recursive: true });

// ---- tiny JSON "database" (swap for SQLite/Postgres in production) ----
let db = { users: [], messages: [], groups: [], nextNumber: 7000000001 };
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
let timer;
const save = () => { clearTimeout(timer); timer = setTimeout(() => fs.writeFile(DB_FILE, JSON.stringify(db), () => {}), 200); };

const app = express(), server = http.createServer(app), io = new Server(server);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(DATA, 'uploads')));

// ---- helpers ----
const uid = () => crypto.randomUUID().slice(0, 8);
const userBy = n => db.users.find(u => u.number === n);
const pub = u => ({ number: u.number, name: u.name, about: u.about, lastSeen: u.lastSeen });
const sign = u => jwt.sign({ number: u.number }, SECRET, { expiresIn: '30d' });
const dmId = (a, b) => ['dm', ...[a, b].sort()].join(':');
const members = chat => chat.startsWith('g:')
  ? (db.groups.find(g => g.id === chat.slice(2)) || { members: [] }).members
  : chat.split(':').slice(1);
const status = m => {
  const others = members(m.chat).filter(x => x !== m.from);
  if (others.length && others.every(x => m.readBy.includes(x))) return 'read';
  if (others.length && others.every(x => m.deliveredTo.includes(x))) return 'delivered';
  return 'sent';
};
const out = m => ({ ...m, status: status(m) });
const online = new Map();

const auth = (req, res, next) => {
  try {
    const p = jwt.verify((req.headers.authorization || '').slice(7), SECRET);
    req.user = userBy(p.number); if (!req.user) throw 0; next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// ---- auth: every new user is allocated a unique number ----
app.post('/api/signup', async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 40), pw = String(req.body.password || '');
  if (!name || pw.length < 6) return res.status(400).json({ error: 'Name and a password of 6+ characters required' });
  const u = { number: String(db.nextNumber++), name, about: 'Hey there! I am using ChatApp.', hash: await bcrypt.hash(pw, 10), lastSeen: Date.now() };
  db.users.push(u); save();
  res.json({ token: sign(u), user: pub(u) });
});
app.post('/api/login', async (req, res) => {
  const u = userBy(String(req.body.number || '').replace(/\D/g, ''));
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.hash))) return res.status(400).json({ error: 'Wrong number or password' });
  res.json({ token: sign(u), user: pub(u) });
});
app.get('/api/me', auth, (req, res) => res.json(pub(req.user)));
app.put('/api/me', auth, (req, res) => {
  if (req.body.name) req.user.name = String(req.body.name).slice(0, 40);
  if (req.body.about != null) req.user.about = String(req.body.about).slice(0, 140);
  save(); res.json(pub(req.user));
});
app.get('/api/users/:number', auth, (req, res) => {
  const u = userBy(req.params.number.replace(/\D/g, ''));
  u ? res.json({ ...pub(u), online: online.has(u.number) }) : res.status(404).json({ error: 'No user with that number' });
});

// ---- chats, messages, groups ----
app.get('/api/chats', auth, (req, res) => {
  const me = req.user.number, map = {};
  db.messages.forEach(m => {
    if (!members(m.chat).includes(me)) return;
    const c = map[m.chat] ??= { id: m.chat, unread: 0 };
    c.last = m; if (m.from !== me && !m.readBy.includes(me)) c.unread++;
  });
  db.groups.filter(g => g.members.includes(me)).forEach(g => map['g:' + g.id] ??= { id: 'g:' + g.id, unread: 0 });
  const list = Object.values(map).map(c => {
    const r = { id: c.id, unread: c.unread, last: c.last && out(c.last) };
    if (c.id.startsWith('g:')) { const g = db.groups.find(x => x.id === c.id.slice(2)); Object.assign(r, { group: true, name: g.name, members: g.members }); }
    else { const o = userBy(members(c.id).find(x => x !== me)); Object.assign(r, { name: o.name, number: o.number, online: online.has(o.number) }); }
    return r;
  });
  res.json(list.sort((a, b) => (b.last?.ts || 0) - (a.last?.ts || 0)));
});
app.get('/api/messages', auth, (req, res) => {
  if (!members(req.query.chat || '').includes(req.user.number)) return res.status(403).json({ error: 'Forbidden' });
  res.json(db.messages.filter(m => m.chat === req.query.chat).map(out));
});
app.post('/api/groups', auth, (req, res) => {
  const nums = [...new Set([req.user.number, ...(req.body.members || []).map(n => String(n).replace(/\D/g, ''))])];
  if (!req.body.name || nums.some(n => !userBy(n))) return res.status(400).json({ error: 'Name required and all numbers must exist' });
  const g = { id: uid(), name: String(req.body.name).slice(0, 40), members: nums, admin: req.user.number };
  db.groups.push(g); save();
  nums.forEach(n => io.to(n).emit('chats-changed'));
  res.json({ id: 'g:' + g.id });
});
const upload = multer({ storage: multer.diskStorage({
  destination: path.join(DATA, 'uploads'),
  filename: (r, f, cb) => cb(null, uid() + uid() + path.extname(f.originalname).slice(0, 8).replace(/[^.\w]/g, ''))
}), limits: { fileSize: 15 * 1024 * 1024 } });
app.post('/api/upload', auth, upload.single('file'), (req, res) =>
  res.json({ url: '/uploads/' + req.file.filename, name: req.file.originalname, type: req.file.mimetype }));

// ---- realtime ----
io.use((s, next) => {
  try { s.number = jwt.verify(s.handshake.auth.token, SECRET).number; userBy(s.number) ? next() : next(new Error('auth')); }
  catch { next(new Error('auth')); }
});
const notify = (m, chat) => members(chat).forEach(n => io.to(n).emit('status', { id: m.id, chat, status: status(m) }));

io.on('connection', s => {
  const me = s.number;
  s.join(me); online.set(me, (online.get(me) || 0) + 1);
  io.emit('presence', { number: me, online: true });
  db.messages.forEach(m => {  // deliver anything received while offline
    if (m.from !== me && members(m.chat).includes(me) && !m.deliveredTo.includes(me)) { m.deliveredTo.push(me); notify(m, m.chat); }
  }); save();

  s.on('send', ({ chat, text, file }, ack) => {
    const mem = members(String(chat || ''));
    text = String(text || '').slice(0, 4000);
    if (!mem.includes(me) || (!text && !file) || mem.some(n => !userBy(n))) return ack && ack({ error: 'Cannot send' });
    const m = { id: uid() + uid(), chat, from: me, text, file: file || null, ts: Date.now(),
      deliveredTo: mem.filter(n => n !== me && online.has(n)), readBy: [me] };
    db.messages.push(m); save();
    mem.forEach(n => io.to(n).emit('message', out(m)));
    ack && ack({ ok: true });
  });
  s.on('typing', ({ chat }) => {
    if (members(String(chat || '')).includes(me))
      members(chat).filter(n => n !== me).forEach(n => io.to(n).emit('typing', { chat, from: me, name: userBy(me).name }));
  });
  s.on('read', ({ chat }) => {
    if (!members(String(chat || '')).includes(me)) return;
    db.messages.forEach(m => {
      if (m.chat === chat && m.from !== me && !m.readBy.includes(me)) {
        m.readBy.push(me); if (!m.deliveredTo.includes(me)) m.deliveredTo.push(me); notify(m, chat);
      }
    }); save();
  });
  s.on('disconnect', () => {
    const c = (online.get(me) || 1) - 1;
    if (c) return online.set(me, c);
    online.delete(me); userBy(me).lastSeen = Date.now(); save();
    io.emit('presence', { number: me, online: false, lastSeen: userBy(me).lastSeen });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('ChatApp running on http://localhost:' + PORT));
