const express = require('express');
const router = express.Router();
const db = require('../server.js');

router.post('/login-demo', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Salah username/password' });
    req.session.user = row;
    res.json({ success: true, role: row.role });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
