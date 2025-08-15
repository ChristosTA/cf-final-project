const { Schema, model, Types } = require('mongoose');

const PasswordResetSchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    tokenHash: { type: String, required: true, unique: true }, // sha256(raw)
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = model('PasswordReset', PasswordResetSchema);
