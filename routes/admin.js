const express = require('express');
const router = express.Router();
const db = require('../server.js');

router.get('/', (req, res) => res.render('admin/dashboard'));
router.get('/users', (req, res) => res.render('admin/users'));

router.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted' });
  });
});

router.put('/api/users/:id/upgrade', (req, res) => {
  db.run('UPDATE users SET role = ? WHERE id = ?', ['reseller', req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User upgraded to reseller' });
  });
});

module.exports = router;
