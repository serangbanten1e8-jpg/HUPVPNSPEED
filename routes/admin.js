const express = require('express');
const router = express.Router();
const db = require('../server.js');

router.get('/', (req, res) => res.render('admin/dashboard'));
router.get('/users', (req, res) => res.render('admin/users'));

router.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => err ? res.status(500).json({ error: err.message }) : res.json(rows));
});

router.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], (err) =>
    err ? res.status(500).json({ error: err.message }) : res.json({ message: 'Deleted' })
  );
});

module.exports = router;
