const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(session({ secret: 'hupvpnspeed', resave: false, saveUninitialized: true, cookie: { secure: false } }));

const db = new sqlite3.Database(':memory__');
module.exports = db;

db.serialize(() => {
  [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'member', balance INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS servers (id TEXT PRIMARY KEY, name TEXT, type TEXT, host TEXT, port INTEGER, status TEXT DEFAULT 'active')`,
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, user_id TEXT, server_id TEXT, type TEXT, username TEXT, password TEXT, expired_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(server_id) REFERENCES servers(id))`,
    `CREATE TABLE IF NOT EXISTS topups (id TEXT PRIMARY KEY, user_id TEXT, method TEXT, amount INTEGER, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS ranking (id TEXT PRIMARY KEY, user_id TEXT, total_sales INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`
  ].forEach(sql => db.run(sql));

  db.run(`INSERT OR IGNORE INTO servers VALUES ('sg1','SG-1','SSH','sg1.hupvpnspeed.my.id',22,'active')`);
  db.run(`INSERT OR IGNORE INTO users VALUES ('admin','admin','admin@hupvpnspeed.com','admin123','admin',999999,datetime('now'))`);
  db.run(`INSERT OR IGNORE INTO users VALUES ('demo','demo','demo@hupvpnspeed.com','demo123','member',50000,datetime('now'))`);
});

app.get('/', (req, res) => res.render('index'));
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('user/dashboard', { user: req.session.user });
});
app.get('/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
  res.render('admin/dashboard');
});

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

app.listen(PORT, () => console.log(`Server running at :${PORT}`));
