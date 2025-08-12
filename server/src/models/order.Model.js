const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Counter = require('./counter.Model');

const orderSchema = new mongoose.Schema({
    publicId:  { type: String, unique: true, index: true },
    serial:    { type: Number, unique: true, index: true },

    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    sellerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    buyerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },

    status:    { type: String, enum: ['REQUESTED','ACCEPTED','DECLINED','CANCELLED','COMPLETED'], default: 'REQUESTED', index: true }
}, { timestamps: true });

orderSchema.pre('save', async function(next){
    try {
        if (!this.publicId) this.publicId = uuidv4();
        if (this.isNew && (this.serial == null)) {
            const c = await Counter.findByIdAndUpdate('Order', { $inc: { seq: 1 } }, { new: true, upsert: true });
            this.serial = c.seq;
        }
        next();
    } catch (e) { next(e); }
});

orderSchema.set('toJSON', { virtuals: true, transform(doc, ret){
        ret.id = ret.publicId || ret._id?.toString();
        delete ret._id; delete ret.__v; delete ret.publicId;
    }});

module.exports = mongoose.models.Order    || mongoose.model('Order', orderSchema);
