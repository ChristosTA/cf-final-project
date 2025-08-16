// server/src/models/transaction.Model.js
const { Schema, model, Types } = require('mongoose');

const TransactionSchema = new Schema({
    order:    { type: Types.ObjectId, ref: 'Order', required: true, index: true },

    // ονοματοδοσία ΣΥΝΕΠΗΣ με Order: buyerId / sellerId
    buyerId:  { type: Types.ObjectId, ref: 'User',  required: true, index: true },
    sellerId: { type: Types.ObjectId, ref: 'User',  required: true, index: true },

    type:   { type: String, enum: ['CHARGE_AUTH','CAPTURE','REFUND'], required: true, index: true },
    status: { type: String, enum: ['PENDING','SUCCESS','FAILED'], required: true, default: 'SUCCESS' },

    amount:   { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'EUR' },

    provider:    { type: String, default: 'mock' },
    providerRef: { type: String, default: null },

    meta: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = model('Transaction', TransactionSchema);
