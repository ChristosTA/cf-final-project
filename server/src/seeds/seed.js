// server/src/scripts/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const User = require('../models/user.Model');
const Category = require('../models/category.Model'); // αν το έχεις με άλλο όνομα, άλλαξέ το
const Listing = require('../models/listing.Model');   // ίδιο εδώ

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketplace';
const SALT_ROUNDS = 10;

const rootCats = [
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Hoodies',  slug: 'hoodies',  parent: 'clothing' },
    { name: 'Tees',     slug: 'tees',     parent: 'clothing' },
    { name: 'Jeans',    slug: 'jeans',    parent: 'clothing' },
    { name: 'Sneakers', slug: 'sneakers', parent: 'clothing' }
];

const BRANDS = ['NorthPeak', 'UrbanX', 'BasicCo'];
const COLORS = ['black', 'white', 'gray', 'navy'];
const SIZES  = ['S', 'M', 'L', 'XL'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function onePhoto(key) {
    return {
        provider: 'local',
        url: `/uploads/demo/${key}.jpg`,
        key: `demo/${key}.jpg`,
        isCover: true
    };
}

async function upsertCategoryTree() {
    const bySlug = {};
    // create parents first
    for (const c of rootCats) {
        let parentId = null;
        if (c.parent) {
            const parent = await Category.findOne({ slug: c.parent });
            parentId = parent?._id || null;
        }
        const doc = await Category.findOneAndUpdate(
            { slug: c.slug },
            { $set: { name: c.name, slug: c.slug, parent: parentId } },
            { upsert: true, new: true }
        );
        bySlug[c.slug] = doc;
    }
    return bySlug;
}

async function upsertUser({ email, username, name, roles = [], isApprovedSeller = false }) {
    const passwordHash = await bcrypt.hash('secret123', SALT_ROUNDS);
    const update = {
        email, username, name, passwordHash,
        roles,
        publicId: randomUUID()
    };

    if (isApprovedSeller) {
        update.sellerStatus = 'APPROVED';
        update.sellerProfile = {
            approved: true,
            approvedAt: new Date(),
            profile: {
                shopName: `${name} Apparel`,
                addresses: [{ line1: 'Ermou 15', city: 'Athens', postalCode: '10563', country: 'GR' }]
            },
            billing: {
                legalName: `${name} Ltd`,
                vatNumber: 'EL123456789',
                billingAddress: { line1: 'Kifisias 1', city: 'Athens', postalCode: '11523', country: 'GR' },
                ibanLast4: '0695'
            },
            activatedAt: new Date()
        };
        if (!update.roles.includes('SELLER')) update.roles.push('SELLER');
    }

    const user = await User.findOneAndUpdate(
        { email },
        { $set: update },
        { new: true, upsert: true }
    );
    return user;
}

async function createListingsForSeller(seller, cats) {
    const titles = [
        'Hoodie Heavyweight', 'Hoodie Classic', 'Hoodie Zip',
        'Tee Oversized', 'Tee Regular', 'Tee Premium'
    ];

    const items = [];
    for (let i = 0; i < 16; i++) {
        const isHoodie = i % 2 === 0;
        const brand = pick(BRANDS);
        const color = pick(COLORS);
        const size  = pick(SIZES);
        const title = `${isHoodie ? 'Hoodie' : 'Tee'} ${brand} - ${color} - ${size}`;
        const category = isHoodie ? cats['hoodies']._id : cats['tees']._id;

        const payload = {
            title,
            description: `${isHoodie ? 'Heavyweight hoodie' : 'Cotton tee'} · ${brand}`,
            price: isHoodie ? 49.9 + (i % 3) * 5 : 19.9 + (i % 3) * 3,
            condition: 'NEW_WITH_TAGS',
            category,
            tags: [brand, color, size, isHoodie ? 'hoodie' : 'tee', 'men'],
            photos: [onePhoto(isHoodie ? 'hoodie' : 'tee')],
            seller: seller._id,
            isActive: true
        };

        items.push(payload);
    }

    if (items.length) await Listing.insertMany(items);
    return items.length;
}

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected:', MONGODB_URI);

    // καθάρισε μόνο τα demo entities για να μην πειράξουμε υπαρκτά data
    await Promise.all([
        User.deleteMany({ email: { $in: ['admin@demo.dev','seller1@demo.dev','seller2@demo.dev'] } }),
        Category.deleteMany({ slug: { $in: rootCats.map(c => c.slug) } }),
        Listing.deleteMany({}) // αν θες πιο επιλεκτικά βάλε seller in [seller1, seller2] αφού δημιουργηθούν
    ]);

    const cats = await upsertCategoryTree();
    console.log('Categories:', Object.keys(cats).join(', '));

    const admin  = await upsertUser({ email: 'admin@demo.dev',  username:'admin',  name:'Admin',  roles:['ADMIN','USER'] });
    const seller1 = await upsertUser({ email: 'seller1@demo.dev', username:'seller1', name:'Alice', isApprovedSeller: true, roles:['USER'] });
    const seller2 = await upsertUser({ email: 'seller2@demo.dev', username:'seller2', name:'Bob',   isApprovedSeller: true, roles:['USER'] });

    console.log('Users:', admin.email, seller1.email, seller2.email);

    const n1 = await createListingsForSeller(seller1, cats);
    const n2 = await createListingsForSeller(seller2, cats);
    console.log(`Listings created: ${n1 + n2}`);

    await mongoose.disconnect();
    console.log('Done.');
}

main().catch(async (err) => {
    console.error(err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
});
