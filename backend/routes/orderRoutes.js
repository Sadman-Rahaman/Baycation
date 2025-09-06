// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Create new order
router.post('/', auth, OrderController.createOrder);

// Get user's orders
router.get('/user/orders', auth, OrderController.getUserOrders);

// Get single order
router.get('/:orderId', auth, OrderController.getOrder);

// Update order status
router.put('/:orderId/status', auth, OrderController.updateOrderStatus);

// Cancel order
router.put('/:orderId/cancel', auth, OrderController.cancelOrder);

// Process refund
router.post('/:orderId/refund', auth, OrderController.processRefund);

module.exports = router;
