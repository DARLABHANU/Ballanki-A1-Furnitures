const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation', index: true },
    product_id: { type: Number, required: true, ref: 'Product' },
    customer_id: { type: Number, required: true, ref: 'User' },
    merchant_id: { type: Number, required: true, ref: 'MerchantProfile' },
    proposed_price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'CONSUMED'],
        default: 'PENDING'
    },
    expires_at: { type: Date, default: null },
    response_time: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Offer', OfferSchema);
