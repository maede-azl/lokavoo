//activity.routes
const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const activityController = require('../controllers/activity.controller');

router.post('/view/:businessId', protect, activityController.recordView);
router.get('/recent-views', protect, activityController.getRecentViews);
router.post('/search', protect, activityController.recordSearch);
router.get('/recent-searches', protect, activityController.getRecentSearches);
router.get('/timeline', protect, activityController.getTimeline);

module.exports = router;