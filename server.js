const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { config } = require('dotenv');
const { Server } = require('socket.io');

config();

const PORT = Number(process.env.PORT || 3000);
const SESSIONS_ROOT = path.join(__dirname, 'sessions');
const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_NAME = 'OWL BUG';

const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason } = baileys;

fs.mkdirSync(SESSIONS_ROOT, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const state = {
  branding: {
    name: 'OWL BUG',
    subtitle: 'WhatsApp Pairing',
    accent: '#7dd3fc'
  },
  menu: {
    status: 'ONLINE',
    prefix: '.',
    main: ['.menu', '.ping', '.alive', '.runtime'],
    pairing: ['.pair', '.session', '.connect'],
    bugTools: ['.bugmenu', '.buginfo', '.bugstatus', '.bugreport']
  },
  sessions: new Map(),
  logs: [],
  botRuntimeStartedAt: Date.now(),
  adminToken: String(process.env.ADMIN_TOKEN || '').trim()
};

const formatTimestamp = (date = new Date()) => date.toISOString();

const addLog = (type, message) => {
  state.logs.unshift({
    id: crypto.randomUUID(),
    type,
    message,
    timestamp: formatTimestamp()
  });

  if (state.logs.length > 200) {
    state.logs.length = 200;
  }
};

const sanitizeSession = (record) => ({
  sessionId: record.sessionId,
  phoneNumber: record.phoneNumber || null,
  status: record.status,
  connectionStatus: record.connectionStatus,
  pairingCode: record.pairingCode || null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  lastConnectionAt: record.lastConnectionAt,
  runtimeSeconds: Number(record.runtimeSeconds || 0),
  connected: Boolean(record.connected),
  reconnecting: Boolean(record.reconnecting),
  disconnected: Boolean(record.disconnected),
  error: record.error || null,
  sessionDir: record.sessionDir
});

const getBotRuntimeSeconds = () => Math.floor((Date.now() - state.botRuntimeStartedAt) / 1000);

const mapStatus = (connection, lastDisconnect) => {
  if (connection === 'open') return 'CONNECTED';
  if (connection === 'connecting') return 'CONNECTING';
  if (lastDisconnect && lastDisconnect.error) return 'CONNECTION_ERROR';
  if (connection === 'close') return 'DISCONNECTED';
  return 'WAITING';
};

const formatPairingCode = (value) => {
  const cleaned = String(value || '').replace(/\D/g, '');
  if (!cleaned) return null;
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
};

const nextSessionId = () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizePhoneNumber = (raw) => {
  if (!raw) return null;

  const cleaned = String(raw).trim().replace(/\s+/g, '');
  if (!cleaned) return null;

  const digits = cleaned.replace(/\D/g, '');
  if (!digits || digits.length < 8 || digits.length > 15) return null;

  if (cleaned.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;

  return `+${digits}`;
};

const requireAdminAuth = (req, res, next) => {
  const providedToken = String(req.body?.token || req.query?.token || '').trim();
  const validSession = req.session?.adminAuthenticated === true;

  if (validSession || (state.adminToken && providedToken && providedToken === state.adminToken)) {
    req.session.adminAuthenticated = true;
    return next();
  }

  return res.status(401).json({ ok: false, message: 'Admin authentication required.' });
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(PUBLIC_DIR));

app.use(session({
  secret: process.env.SESSION_SECRET || 'owlbug-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 12
  }
}));

const csrfProtection = csrf({ cookie: false });

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests. Please try again shortly.' }
});

const pairingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Pairing requests are rate-limited. Please wait a moment.' }
});

app.use(generalLimiter);

app.get('/api/csrf-token', (req, res) => {
  const token = req.csrfToken ? req.csrfToken() : crypto.randomUUID();
  res.json({ ok: true, csrfToken: token });
});

app.use((req, res, next) => {
  if (req.method !== 'GET') {
    csrfProtection(req, res, next);
  } else {
    next();
  }
});

app.get('/api/brand', (req, res) => {
  res.json({ ok: true, brand: state.branding, menu: state.menu });
});

app.get('/api/menu', (req, res) => {
  res.json({ ok: true, menu: state.menu });
});

app.post('/api/menu/update', requireAdminAuth, (req, res) => {
  const { prefix, status, main, pairing, bugTools } = req.body || {};

  if (typeof prefix === 'string' && prefix.trim()) state.menu.prefix = prefix.trim();
  if (typeof status === 'string' && status.trim()) state.menu.status = status.trim().toUpperCase();
  if (Array.isArray(main)) state.menu.main = main;
  if (Array.isArray(pairing)) state.menu.pairing = pairing;
  if (Array.isArray(bugTools)) state.menu.bugTools = bugTools;

  addLog('menu', 'Bot menu updated.');
  res.json({ ok: true, menu: state.menu });
});

app.post('/api/branding/update', requireAdminAuth, (req, res) => {
  const { name, subtitle, accent } = req.body || {};

  if (typeof name === 'string' && name.trim()) state.branding.name = name.trim();
  if (typeof subtitle === 'string' && subtitle.trim()) state.branding.subtitle = subtitle.trim();
  if (typeof accent === 'string' && accent.trim()) state.branding.accent = accent.trim();

  addLog('branding', 'Branding updated.');
  res.json({ ok: true, brand: state.branding });
});

app.post('/api/admin/login', (req, res) => {
  const { token } = req.body || {};

  if (!state.adminToken) {
    return res.status(500).json({ ok: false, message: 'Admin token is not configured.' });
  }

  if (token !== state.adminToken) {
    return res.status(401).json({ ok: false, message: 'Invalid admin token.' });
  }

  req.session.adminAuthenticated = true;
  res.json({ ok: true, message: 'Admin login successful.' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.adminAuthenticated = false;
  res.json({ ok: true, message: 'Logged out.' });
});

const bootSession = async ({ sessionId, phoneNumber, sessionDir }) => {
  const record = {
    sessionId,
    phoneNumber,
    sessionDir,
    status: 'WAITING',
    connectionStatus: 'WAITING',
    pairingCode: null,
    connected: false,
    reconnecting: false,
    disconnected: false,
    error: null,
    createdAt: formatTimestamp(),
    updatedAt: formatTimestamp(),
    lastConnectionAt: null,
    runtimeSeconds: 0,
    userAgent: 'OWL BUG Web Pairing'
  };

  const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: authState,
    printQRInTerminal: false,
    browser: ['OWL BUG', 'Chrome', '1.0.0'],
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    const nextStatus = mapStatus(connection, lastDisconnect);

    record.status = nextStatus;
    record.connectionStatus = nextStatus;
    record.connected = connection === 'open';
    record.disconnected = connection === 'close';
    record.reconnecting = connection === 'connecting';
    record.error = lastDisconnect && lastDisconnect.error ? lastDisconnect.error.toString() : null;
    record.updatedAt = formatTimestamp();

    if (connection === 'open') {
      record.lastConnectionAt = formatTimestamp();
    }

    if (connection === 'close') {
      record.disconnected = true;
      record.connected = false;
    }

    if (lastDisconnect && lastDisconnect.error) {
      addLog('connection', `${record.sessionId}: ${record.error}`);
    }

    io.emit('session:update', sanitizeSession(record));
  });

  state.sessions.set(sessionId, record);

  return { sock, record };
};

app.post('/api/pairing/request', pairingLimiter, async (req, res) => {
  try {
    const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber);

    if (!phoneNumber) {
      return res.status(400).json({ ok: false, message: 'Please enter a valid WhatsApp phone number.' });
    }

    const sessionId = nextSessionId();
    const sessionDir = path.join(SESSIONS_ROOT, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { sock, record } = await bootSession({ sessionId, phoneNumber, sessionDir });

    const code = await sock.requestPairingCode(phoneNumber);
    record.pairingCode = formatPairingCode(code);
    record.status = 'PAIRING_CODE_GENERATED';
    record.connectionStatus = 'PAIRING_CODE_GENERATED';
    record.updatedAt = formatTimestamp();
    record.error = null;

    addLog('pairing', `Pairing code generated for ${phoneNumber}.`);
    io.emit('session:update', sanitizeSession(record));

    res.json({
      ok: true,
      message: 'Pairing code generated successfully.',
      session: sanitizeSession(record),
      pairingCode: record.pairingCode
    });
  } catch (error) {
    addLog('pairing-error', error?.message || 'Unknown pairing error.');
    res.status(500).json({
      ok: false,
      message: error?.message || 'Unable to generate pairing code.'
    });
  }
});

app.get('/api/sessions', (req, res) => {
  const allSessions = Array.from(state.sessions.values()).map(sanitizeSession);
  res.json({ ok: true, sessions: allSessions });
});

app.get('/api/session/:sessionId', (req, res) => {
  const session = state.sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ ok: false, message: 'Session not found.' });
  }

  res.json({ ok: true, session: sanitizeSession(session) });
});

app.post('/api/session/:sessionId/disconnect', requireAdminAuth, async (req, res) => {
  const record = state.sessions.get(req.params.sessionId);
  if (!record) {
    return res.status(404).json({ ok: false, message: 'Session not found.' });
  }

  const sock = record.sock;
  if (sock && typeof sock.ws?.close === 'function') {
    sock.ws.close();
  }

  record.connected = false;
  record.disconnected = true;
  record.status = 'DISCONNECTED';
  record.connectionStatus = 'DISCONNECTED';
  record.updatedAt = formatTimestamp();

  addLog('disconnect', `Session ${record.sessionId} disconnected.`);
  io.emit('session:update', sanitizeSession(record));
  res.json({ ok: true, message: 'Session disconnected.' });
});

app.delete('/api/session/:sessionId', requireAdminAuth, (req, res) => {
  const record = state.sessions.get(req.params.sessionId);
  if (!record) {
    return res.status(404).json({ ok: false, message: 'Session not found.' });
  }

  const sessionDir = path.join(SESSIONS_ROOT, record.sessionId);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  state.sessions.delete(record.sessionId);
  addLog('cleanup', `Removed abandoned session ${record.sessionId}.`);
  io.emit('session:removed', { sessionId: record.sessionId });
  res.json({ ok: true, message: 'Session removed.' });
});

app.get('/api/admin/summary', requireAdminAuth, (req, res) => {
  const all = Array.from(state.sessions.values());
  const active = all.filter((item) => item.connected).length;
  const disconnected = all.filter((item) => item.disconnected || item.status === 'DISCONNECTED').length;
  const pairingAttempts = all.filter((item) => item.pairingCode).length;
  const errors = all.filter((item) => item.error).length;

  res.json({
    ok: true,
    summary: {
      users: all.length,
      activeSessions: active,
      disconnectedSessions: disconnected,
      pairingAttempts,
      connectionErrors: errors,
      botRuntime: getBotRuntimeSeconds(),
      systemStatus: 'ONLINE'
    }
  });
});

app.get('/api/admin/logs', requireAdminAuth, (req, res) => {
  res.json({ ok: true, logs: state.logs });
});

app.post('/api/admin/restart', requireAdminAuth, (req, res) => {
  addLog('restart', 'Bot restart requested.');
  res.json({ ok: true, message: 'Restart signal sent.' });
  setTimeout(() => process.exit(0), 250);
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: APP_NAME,
    uptime: getBotRuntimeSeconds(),
    connectedSessions: Array.from(state.sessions.values()).filter((s) => s.connected).length,
    totalSessions: state.sessions.size,
    systemStatus: 'ONLINE'
  });
});

app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

setInterval(() => {
  for (const record of state.sessions.values()) {
    if (record.connected) {
      record.runtimeSeconds = Math.max(0, record.runtimeSeconds + 1);
      record.updatedAt = formatTimestamp();
      io.emit('session:update', sanitizeSession(record));
    }
  }
}, 1000);

io.on('connection', (socket) => {
  socket.emit('system:state', {
    app: APP_NAME,
    status: 'ONLINE',
    brand: state.branding,
    menu: state.menu
  });
});

server.listen(PORT, () => {
  addLog('boot', `OWL BUG server started on port ${PORT}.`);
  console.log(`OWL BUG server listening on http://localhost:${PORT}`);
});
