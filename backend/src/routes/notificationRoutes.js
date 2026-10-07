const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ notifications: [], unreadCount: 0 }));
router.put('/:id/read', (req, res) => res.json({ success: true }));

module.exports = router;
