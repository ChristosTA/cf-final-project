const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Counter = require('./counter.Model');


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, index: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ['USER','ADMIN','SELLER',"BUYER"], default: ['USER'], index: true },
    publicId: { type: String, unique: true, index: true },
    serial: { type: Number, unique: true, index: true }
}, { timestamps: true });

userSchema.pre('save', async function(next){
    try {
        if (!this.publicId) this.publicId = uuidv4();
        if (this.isNew && (this.serial == null)) {
            const c = await Counter.findByIdAndUpdate(
                'User',
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.serial = c.seq;
        }
        next();
    } catch (err) { next(err); }
});

userSchema.set('toJSON', {
    virtuals: true,
    transform(doc, ret) {
        ret.id = ret.publicId || ret._id?.toString();
        delete ret._id; delete ret.__v; delete ret.passwordHash; delete ret.publicId;
    }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.User     || mongoose.model('User', userSchema);
