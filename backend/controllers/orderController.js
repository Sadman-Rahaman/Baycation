// backend/controllers/orderController.js
const Order = require('../models/Order');
const Gear = require('../models/Gear');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class OrderController {
  // Create new order
  static async createOrder(req, res) {
    try {
      const { items, shippingAddress, pickupAddress, deliveryMethod, paymentMethod } = req.body;
      const buyerId = req.user.userId;

      // Validate items and calculate total
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const gear = await Gear.findById(item.gear);
        if (!gear) {
          return res.status(404).json({
            success: false,
            message: `Gear item ${item.gear} not found`
          });
        }

        if (!gear.isActive || !gear.availability.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `Gear item ${gear.name} is not available`
          });
        }

        const itemTotal = gear.price.amount * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          gear: gear._id,
          quantity: item.quantity,
          price: {
            amount: gear.price.amount,
            currency: gear.price.currency
          },
          rentalPeriod: item.rentalPeriod
        });
      }

      const order = new Order({
        order_id: uuidv4(),
        buyer: buyerId,
        seller: items[0].seller, // Assuming all items are from same seller
        items: orderItems,
        totalAmount: {
          amount: totalAmount,
          currency: items[0].currency || 'USD'
        },
        shippingAddress,
        pickupAddress,
        deliveryMethod,
        paymentMethod,
        status: 'pending'
      });

      await order.save();
      await order.populate('buyer', 'name email');
      await order.populate('seller', 'name email');
      await order.populate('items.gear', 'name price images');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order }
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating order'
      });
    }
  }

  // Get user's orders
  static async getUserOrders(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status } = req.query;

      let query = { $or: [{ buyer: userId }, { seller: userId }] };

      if (status) {
        query.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const orders = await Order.find(query)
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('items.gear', 'name price images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / parseInt(limit)),
            count: orders.length,
            totalOrders: total
          }
        }
      });
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching orders'
      });
    }
  }

  // Get single order
  static async getOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;

      const order = await Order.findById(orderId)
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('items.gear', 'name price images');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user is buyer or seller
      if (order.buyer._id.toString() !== userId && order.seller._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching order'
      });
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.userId;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user is seller or admin
      const user = await User.findById(userId);
      const isSeller = order.seller.toString() === userId;
      const isAdmin = user && user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only seller or admin can update order status'
        });
      }

      order.status = status;
      if (notes) order.notes = notes;

      // Update delivery date if status is delivered
      if (status === 'delivered') {
        order.deliveryDate = new Date();
      }

      await order.save();

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: { order }
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating order status'
      });
    }
  }

  // Cancel order
  static async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = req.user.userId;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user is buyer or seller
      const isBuyer = order.buyer.toString() === userId;
      const isSeller = order.seller.toString() === userId;

      if (!isBuyer && !isSeller) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Only allow cancellation if order is pending or confirmed
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be cancelled at this stage'
        });
      }

      order.status = 'cancelled';
      order.cancellationReason = reason;
      await order.save();

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order }
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while cancelling order'
      });
    }
  }

  // Process refund
  static async processRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user.userId;

      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if user is seller or admin
      const user = await User.findById(userId);
      const isSeller = order.seller.toString() === userId;
      const isAdmin = user && user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only seller or admin can process refunds'
        });
      }

      order.refundAmount = {
        amount: amount || order.totalAmount.amount,
        currency: order.totalAmount.currency,
        reason,
        processedAt: new Date()
      };

      order.status = 'refunded';
      order.paymentStatus = 'refunded';

      await order.save();

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: { order }
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing refund'
      });
    }
  }
}

module.exports = OrderController;
