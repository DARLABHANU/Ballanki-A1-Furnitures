const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
    order_id: { type: Number, required: true, ref: 'Order', index: true },
    user_id: { type: Number, required: true, ref: 'User', index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    transaction_type: {
        type: String,
        enum: ['DEPOSIT', 'BALANCE', 'FULL_PAYMENT', 'REFUND', 'ADJUSTMENT'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'VERIFIED'],
        default: 'PENDING'
    },
    payment_provider: { type: String, default: null }, // e.g., 'razorpay'
    provider_order_id: { type: String, default: null },
    provider_payment_id: { type: String, default: null },
    provider_signature: { type: String, default: null },
    verification_details: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
