const express = require('express');
const router = express.Router();
const db = require('../server.js');
const auth = require('../middleware/auth');

router.post('/create-ssh', auth, (req, res) => {
  const { username, password, server, duration } = req.body;
  const id = require('uuid').v4();
  db.run(
    'INSERT INTO accounts (id, user_id, server_id, type, username, password, expired_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now", "+" || ? || " days"))',
    [id, req.user.uid, server, 'SSH', username, password, duration],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Akun SSH berhasil dibuat', id });
    }
  );
});

router.post('/topup', auth, (req, res) => {
  const { method, amount } = req.body;
  const id = require('uuid').v4();
  db.run(
    'INSERT INTO topups (id, user_id, method, amount, status) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.uid, method, amount, 'pending'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Permintaan top up diterima', id });
    }
  );
});

router.get('/me', auth, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

module.exports = router;
