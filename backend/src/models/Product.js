const mongoose = require('mongoose');
const Counter = require('./Counter');

const ProductSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  merchant_id: { type: Number, required: true, ref: 'MerchantProfile', index: true },
  category_id: { type: Number, ref: 'Category', default: null, index: true },
  subcategory: { type: String, default: null, index: true },
  subcategory_slug: { type: String, default: null, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  short_description: { type: String, default: null },
  price: { type: Number, required: true },
  base_price: { type: Number, default: null },
  compare_price: { type: Number, default: null },
  cost_price: { type: Number, default: null },
  sku: { type: String, unique: true, sparse: true, default: null },
  stock_quantity: { type: Number, default: 0 },
  low_stock_threshold: { type: Number, default: 5 },
  weight_grams: { type: Number, default: null },
  images: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Furniture specific fields
  material: { type: String, default: null },
  wood_type: { type: String, default: null },
  dimensions: { 
    length: { type: Number, default: null }, 
    width: { type: Number, default: null }, 
    height: { type: Number, default: null }, 
    unit: { type: String, default: 'cm' }
  },

  // Fulfillment and pre-order fields
  fulfillment_type: { type: String, enum: ['READY_STOCK', 'MADE_TO_ORDER', 'CUSTOM_ORDER'], default: 'READY_STOCK' },
  allow_pre_order: { type: Boolean, default: false },
  
  // Manufacturing estimates (in calendar days)
  manufacturing_duration_days: { type: Number, default: 0 },
  preparation_duration_days: { type: Number, default: 0 },
  quality_check_duration_days: { type: Number, default: 0 },
  packing_duration_days: { type: Number, default: 0 },
  shipping_duration_days: { type: Number, default: 0 },
  
  // Advance deposit settings
  deposit_policy: {
    is_required: { type: Boolean, default: false },
    deposit_type: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    deposit_value: { type: Number, default: 0 } // e.g. 30 for 30%, or 5000 for ₹5000
  },

  is_active: { type: Boolean, default: true, index: true },
  is_approved: { type: Boolean, default: false, index: true },
  is_featured: { type: Boolean, default: false },
  rating_avg: { type: Number, default: 0.0 },
  rating_count: { type: Number, default: 0 },
  total_sold: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Auto-increment sequence hook and dynamic customer price calculation
ProductSchema.pre('save', async function (next) {
  if (this.base_price !== undefined && this.base_price !== null && Number(this.base_price) > 0) {
    this.base_price = Number(this.base_price);
    this.price = this.base_price;
  } else if (this.price !== undefined && this.price !== null && Number(this.price) > 0) {
    this.base_price = Number(this.price);
    this.price = Number(this.price);
  } else {
    this.base_price = 1700;
    this.price = 1700;
  }

  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'productId',
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

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
