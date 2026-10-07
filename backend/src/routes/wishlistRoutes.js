const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ items: [] }));
router.post('/toggle', (req, res) => res.json({ success: true, added: true }));

module.exports = router;
