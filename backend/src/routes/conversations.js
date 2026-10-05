const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Offer = require('../models/Offer');
const Product = require('../models/Product');
const MerchantProfile = require('../models/MerchantProfile');
const { getCurrentUser, requireMerchantOrAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Guest/Auth flow:
 * Guests hit "Negotiate Price", UI prompts login, then sends them back.
 * UI hits POST /conversations/init with product_id.
 * If conversation exists for this user+product, it returns it. Else creates it.
 */
router.post('/init', getCurrentUser, async (req, res, next) => {
    try {
        const { product_id } = req.body;
        if (!product_id) return res.status(400).json({ detail: 'product_id is required' });

        const product = await Product.findOne({ id: Number(product_id), is_active: true });
        if (!product) return res.status(404).json({ detail: 'Product not found' });

        let conversation = await Conversation.findOne({
            product_id: product.id,
            customer_id: req.user.id,
            status: 'ACTIVE'
        });

        if (!conversation) {
            conversation = new Conversation({
                product_id: product.id,
                customer_id: req.user.id,
                merchant_id: product.merchant_id,
                listed_price_at_creation: product.price
            });
            await conversation.save();
        }

        res.status(200).json(conversation);
    } catch (error) {
        next(error);
    }
});

// GET /conversations - List conversations (Customer or Merchant)
router.get('/', getCurrentUser, async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role === 'customer') {
            filter.customer_id = req.user.id;
        } else if (req.user.role === 'merchant') {
            const merchant = await MerchantProfile.findOne({ user_id: req.user.id });
            if (!merchant) return res.status(404).json({ detail: 'Merchant profile required' });
            filter.merchant_id = merchant.id;
        } else {
            return res.status(403).json({ detail: 'Admins cannot negotiate directly yet' });
        }

        const conversations = await Conversation.find(filter).sort({ last_message_at: -1 }).populate('product_id');
        res.json(conversations);
    } catch (error) {
        next(error);
    }
});

// GET /conversations/:id/messages
router.get('/:id/messages', getCurrentUser, async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ detail: 'Conversation not found' });

        // Auth check
        const isCustomer = req.user.role === 'customer' && conversation.customer_id === req.user.id;
        let isOwnerMerchant = false;
        if (req.user.role === 'merchant') {
            const m = await MerchantProfile.findOne({ user_id: req.user.id });
            if (m && m.id === conversation.merchant_id) isOwnerMerchant = true;
        }

        if (!isCustomer && !isOwnerMerchant) {
            return res.status(403).json({ detail: 'Access denied' });
        }

        const messages = await Message.find({ conversation_id: conversation._id }).sort({ created_at: 1 }).populate('offer_id');

        // Clear unread counts
        if (isCustomer) {
            conversation.customer_unread_count = 0;
        } else if (isOwnerMerchant) {
            conversation.merchant_unread_count = 0;
        }
        await conversation.save();

        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// POST /conversations/:id/messages
router.post('/:id/messages', getCurrentUser, async (req, res, next) => {
    try {
        const { content, offer_price } = req.body;
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ detail: 'Conversation not found' });
        if (conversation.status !== 'ACTIVE') return res.status(400).json({ detail: 'Conversation is closed' });

        let senderType;
        let senderId;
        let isCustomer = false;

        if (req.user.role === 'customer') {
            if (conversation.customer_id !== req.user.id) return res.status(403).json({ detail: 'Access denied' });
            senderType = 'CUSTOMER';
            senderId = req.user.id;
            isCustomer = true;
        } else if (req.user.role === 'merchant') {
            const m = await MerchantProfile.findOne({ user_id: req.user.id });
            if (!m || m.id !== conversation.merchant_id) return res.status(403).json({ detail: 'Access denied' });
            senderType = 'MERCHANT';
            senderId = m.id;
        } else {
            return res.status(403).json({ detail: 'Invalid role' });
        }

        let offerDoc = null;
        if (offer_price && !isNaN(Number(offer_price))) {
            const price = Number(offer_price);
            if (price <= 0) return res.status(400).json({ detail: 'Offer must be positive' });

            const offer = new Offer({
                conversation_id: conversation._id,
                product_id: conversation.product_id,
                customer_id: conversation.customer_id,
                merchant_id: conversation.merchant_id,
                proposed_price: price,
                status: isCustomer ? 'PENDING' : 'COUNTERED'
            });
            await offer.save();
            offerDoc = offer;
        }

        const message = new Message({
            conversation_id: conversation._id,
            sender_type: senderType,
            sender_id: senderId,
            content,
            is_offer: !!offerDoc,
            offer_id: offerDoc ? offerDoc._id : null
        });

        await message.save();

        if (isCustomer) {
            conversation.merchant_unread_count += 1;
        } else {
            conversation.customer_unread_count += 1;
        }
        conversation.last_message_at = new Date();
        await conversation.save();

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
});

// POST /conversations/offers/:offer_id/accept
router.post('/offers/:offer_id/accept', getCurrentUser, async (req, res, next) => {
    try {
        const offer = await Offer.findById(req.params.offer_id);
        if (!offer) return res.status(404).json({ detail: 'Offer not found' });
        if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
            return res.status(400).json({ detail: 'Offer cannot be accepted in current state' });
        }

        const conversation = await Conversation.findById(offer.conversation_id);
        if (!conversation) return res.status(404).json({ detail: 'Conversation missing' });

        let isCustomer = false;
        if (req.user.role === 'customer') {
            if (offer.customer_id !== req.user.id) return res.status(403).json({ detail: 'Access denied' });
            if (offer.status !== 'COUNTERED') return res.status(400).json({ detail: 'You can only accept merchant counteroffers' });
            isCustomer = true;
        } else if (req.user.role === 'merchant') {
            const m = await MerchantProfile.findOne({ user_id: req.user.id });
            if (!m || m.id !== offer.merchant_id) return res.status(403).json({ detail: 'Access denied' });
            if (offer.status !== 'PENDING') return res.status(400).json({ detail: 'You can only accept customer offers' });
        } else {
            return res.status(403).json({ detail: 'Invalid role' });
        }

        // Accept offer
        offer.status = 'ACCEPTED';
        offer.response_time = new Date();

        // Invalidate other pending offers
        await Offer.updateMany(
            { conversation_id: conversation._id, _id: { $ne: offer._id }, status: { $in: ['PENDING', 'COUNTERED'] } },
            { $set: { status: 'EXPIRED' } }
        );
        await offer.save();

        const msg = new Message({
            conversation_id: conversation._id,
            sender_type: 'SYSTEM',
            sender_id: 0,
            content: `Offer of ₹${offer.proposed_price} accepted by ${isCustomer ? 'Customer' : 'Merchant'}.`
        });
        await msg.save();

        res.json(offer);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
