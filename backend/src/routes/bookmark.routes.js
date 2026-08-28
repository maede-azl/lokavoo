//bookmark.routes.js
const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const bookmarkController = require('../controllers/bookmark.controller');

router.get('/', protect, bookmarkController.getMyBookmarks);
router.get('/:businessId/status', protect, bookmarkController.checkBookmarkStatus);
router.post('/:businessId/toggle', protect, bookmarkController.toggleBookmark);

module.exports = router;