const mongoose = require('mongoose');
const Counter = require('./Counter');

const OrderSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  order_number: { type: String, required: true, unique: true, index: true },
  customer_id: { type: Number, required: true, ref: 'User', index: true },
  address_id: { type: Number, ref: 'Address', default: null },
  coupon_id: { type: Number, ref: 'Coupon', default: null },
  subtotal: { type: Number, required: true },
  discount_amount: { type: Number, default: 0.0 },
  platform_fee: { type: Number, default: 0.0 }, // Platform/Service fee e.g. ₹30 for promoter coupon
  shipping_amount: { type: Number, default: 0.0 },
  tax_amount: { type: Number, default: 0.0 },
  total_amount: { type: Number, required: true },

  // Deposit and Pre-order Payments
  deposit_amount_required: { type: Number, default: 0.0 },
  deposit_amount_paid: { type: Number, default: 0.0 },
  remaining_balance_due: { type: Number, default: 0.0 },
  remaining_balance_paid: { type: Number, default: 0.0 },

  status: {
    type: String,
    enum: [
      'pending_confirmation',
      'pending_payment',
      'confirmed',
      'queued_for_production',
      'in_production',
      'quality_check',
      'ready_for_dispatch',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refund_pending',
      'refunded'
    ],
    default: 'pending_payment',
    index: true
  },
  payment_status: {
    type: String,
    enum: [
      'pending',
      'deposit_pending',
      'deposit_paid',
      'balance_due',
      'partially_paid',
      'fully_paid',
      'failed',
      'refund_pending',
      'partially_refunded',
      'refunded'
    ],
    default: 'pending'
  },

  payment_method: { type: String, default: null },
  payment_reference: { type: String, default: null },
  razorpay_order_id: { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  razorpay_signature: { type: String, default: null },
  tracking_number: { type: String, default: null },
  current_location: { type: String, default: null },
  notes: { type: String, default: null },
  status_history: { type: [mongoose.Schema.Types.Mixed], default: [] },

  // Date estimates
  production_start_date: { type: Date, default: null },
  estimated_completion_date: { type: Date, default: null },
  estimated_delivery_date: { type: Date, default: null },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  delivered_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'orderId',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
