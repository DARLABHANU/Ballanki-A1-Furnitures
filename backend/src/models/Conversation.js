const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    product_id: { type: Number, required: true, ref: 'Product', index: true },
    customer_id: { type: Number, required: true, ref: 'User', index: true },
    merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
    listed_price_at_creation: { type: Number, required: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' },
    last_message_at: { type: Date, default: Date.now },
    customer_unread_count: { type: Number, default: 0 },
    merchant_unread_count: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Single active conversation per customer per product
ConversationSchema.index({ product_id: 1, customer_id: 1, status: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
