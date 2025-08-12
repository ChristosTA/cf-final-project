const mongoose = require('mongoose');
const slugify = s => s.toString().toLowerCase().trim()
    .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    path: { type: [String], default: [] }
}, { timestamps: true });

categorySchema.pre('validate', function(next){
    if (!this.slug) this.slug = slugify(this.name);
    next();
});

categorySchema.set('toJSON', {
    virtuals: true,
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
    }
});

categorySchema.set('toObject', { virtuals: true });


module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
