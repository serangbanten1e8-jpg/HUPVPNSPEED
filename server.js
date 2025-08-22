const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'hupvpnspeed',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const db = new sqlite3.Database(':memory:');

// ==== TABLE CREATION ====
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    fullname TEXT,
    username TEXT PRIMARY KEY,
    email TEXT,
    password TEXT,
    role TEXT,
    balance INTEGER,
    created_at DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    price INTEGER,
    active INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    product_id INTEGER,
    amount INTEGER,
    status TEXT,
    created_at DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS topup_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    amount INTEGER,
    code TEXT,
    status TEXT,
    created_at DATETIME
  )`);

  // ==== DEFAULT DATA ====
  db.run("INSERT OR IGNORE INTO users VALUES ('admin','admin','admin@hupvpnspeed.com','admin123','admin',999999,datetime('now'))");
  db.run("INSERT OR IGNORE INTO users VALUES ('demo','demo','demo@hupvpnspeed.com','demo123','member',50000,datetime('now'))");
  db.run("INSERT OR IGNORE INTO products VALUES (1,'Paket 30 Hari','Akses VPN 30 hari',50000,1)");
  db.run("INSERT OR IGNORE INTO products VALUES (2,'Paket 7 Hari','Akses VPN 7 hari',15000,1)");
  db.run("INSERT OR IGNORE INTO products VALUES (3,'Paket 1 Hari','Akses VPN 1 hari',5000,1)");
});

// ==== MIDDLEWARE ====
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).send('Access Denied');
  next();
}

// ==== ROUTES ====

// Home
app.get('/', (req, res) => {
  res.render('index');
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (row) {
      req.session.user = row;
      res.redirect('/dashboard');
    } else {
      res.send('Invalid username or password');
    }
  });
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { fullname, username, email, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (row) {
      res.send('Username already exists');
    } else {
      db.run("INSERT INTO users (fullname, username, email, password, role, balance, created_at) VALUES (?, ?, ?, ?, 'member', 0, datetime('now'))",
        [fullname, username, email, password], function (err) {
          if (err) {
            console.error(err);
            return res.status(500).send('Database error');
          }
          res.redirect('/login');
        });
    }
  });
});

// Dashboard
app.get('/dashboard', requireLogin, (req, res) => {
  db.all("SELECT * FROM products WHERE active = 1", (err, products) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('dashboard', { user: req.session.user, products });
  });
});

// Buy
app.post('/buy', requireLogin, (req, res) => {
  const { product_id } = req.body;
  const userId = req.session.user.username;

  db.get("SELECT * FROM products WHERE id = ?", [product_id], (err, product) => {
    if (err || !product) return res.status(404).send('Product not found');

    db.get("SELECT balance FROM users WHERE username = ?", [userId], (err, user) => {
      if (err) return res.status(500).send('Database error');
      if (user.balance < product.price) return res.send('Insufficient balance');

      const newBalance = user.balance - product.price;
      db.serialize(() => {
        db.run("UPDATE users SET balance = ? WHERE username = ?", [newBalance, userId]);
        db.run("INSERT INTO transactions (user_id, product_id, amount, status, created_at) VALUES (?, ?, ?, 'success', datetime('now'))",
          [userId, product_id, product.price]);
      });
      req.session.user.balance = newBalance;
      res.redirect('/dashboard');
    });
  });
});

// Topup
app.get('/topup', requireLogin, (req, res) => {
  res.render('topup');
});

app.post('/topup', requireLogin, (req, res) => {
  const { amount } = req.body;
  const userId = req.session.user.username;
  const topupCode = 'TP-' + Date.now();

  db.run("INSERT INTO topup_requests (user_id, amount, code, status, created_at) VALUES (?, ?, ?, 'pending', datetime('now'))",
    [userId, amount, topupCode], function (err) {
      if (err) return res.status(500).send('Database error');
      res.send(`Topup request submitted. Code: ${topupCode}`);
    });
});

// Admin
app.get('/admin', requireAdmin, (req, res) => {
  db.all("SELECT * FROM users", (err, users) => {
    if (err) return res.status(500).send('Database error');
    db.all("SELECT * FROM transactions", (err, transactions) => {
      if (err) return res.status(500).send('Database error');
      db.all("SELECT * FROM topup_requests", (err, topups) => {
        if (err) return res.status(500).send('Database error');
        res.render('admin', { users, transactions, topups });
      });
    });
  });
});

// Admin approve/reject topup
app.post('/admin/topup/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM topup_requests WHERE id = ?", [id], (err, topup) => {
    if (err || !topup) return res.status(404).send('Topup not found');

    db.serialize(() => {
      db.run("UPDATE topup_requests SET status = 'approved' WHERE id = ?", [id]);
      db.run("UPDATE users SET balance = balance + ? WHERE username = ?", [topup.amount, topup.user_id]);
    });
    res.redirect('/admin');
  });
});

app.post('/admin/topup/:id/reject', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("UPDATE topup_requests SET status = 'rejected' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send('Database error');
    res.redirect('/admin');
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
