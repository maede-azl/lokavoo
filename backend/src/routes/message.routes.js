const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const checkBusinessOwner = require('../middlewares/checkBusinessOwner');
const {
  getConversations,
  sendMessage,
  markConversationRead,
  createTestConversation,
  getMyConversations,
  startOrGetConversation,
  sendCustomerMessage,
  markCustomerConversationRead,
} = require('../controllers/message.controller');

// ===== سمت فروشنده =====
router.get(
  '/business/:businessId',
  protect,
  checkBusinessOwner,
  getConversations
);
router.post('/:conversationId/send', protect, sendMessage);
router.put('/:conversationId/read', protect, markConversationRead);
router.post(
  '/business/:businessId/test',
  protect,
  checkBusinessOwner,
  createTestConversation
);

// ===== سمت مشتری =====
router.get('/mine', protect, getMyConversations);
router.post('/business/:businessId/start', protect, startOrGetConversation);
router.post('/:conversationId/customer-send', protect, sendCustomerMessage);
router.put('/:conversationId/customer-read', protect, markCustomerConversationRead);

module.exports = router;