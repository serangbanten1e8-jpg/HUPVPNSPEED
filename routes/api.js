const express = require('express');
const router = express.Router();
const db = require('../server.js');

router.post('/create-ssh', (req, res) => {
  const { username, password, server, duration } = req.body;
  const id = require('uuid').v4();
  db.run(
    'INSERT INTO accounts (id,user_id,server_id,type,username,password,expired_at) VALUES (?,?,?,?,?,?,datetime("now","+"||?||" days"))',
    [id, 'demo', server, 'SSH', username, password, duration],
    (err) => err ? res.status(500).json({ error: err.message }) : res.json({ message: 'SSH dibuat' })
  );
});

router.post('/topup', (req, res) => {
  const { method, amount } = req.body;
  const id = require('uuid').v4();
  db.run('INSERT INTO topups (id,user_id,method,amount,status) VALUES (?,?,?,?,?)', [id, 'demo', method, amount, 'pending'],
    (err) => err ? res.status(500).json({ error: err.message }) : res.json({ message: 'Top-up diterima' })
  );
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id], (err, row) =>
    err ? res.status(500).json({ error: err.message }) : res.json(row)
  );
});

module.exports = router;
