const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Conversation', index: true },
    sender_type: { type: String, enum: ['CUSTOMER', 'MERCHANT', 'SYSTEM'], required: true },
    sender_id: { type: Number, required: true }, // User id or Merchant id
    content: { type: String, default: null },
    is_offer: { type: Boolean, default: false },
    offer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    read_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Message', MessageSchema);
