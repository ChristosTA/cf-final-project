const { Schema, model, Types } = require('mongoose');

const RefreshTokenSchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', index: true, required: true },
    jti: { type: String, index: true, unique: true, required: true }, // random id
    tokenHash: { type: String, required: true }, // sha256(refreshJwt)
    expiresAt: { type: Date, index: true, required: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null }
}, { timestamps: true });

module.exports = model('RefreshToken', RefreshTokenSchema);
