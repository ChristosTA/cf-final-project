const Listing = require('../models/listing.Model');
async function seedListings(userId) {
    const count = await Listing.countDocuments();
    if (count > 0) return;

    await Listing.create([
        {
            sellerId: userId,
            title: 'Zara denim jacket',
            description: 'Μπλε τζην, φορεμένο λίγες φορές',
            condition: 'GOOD',
            price: 2500, // 25.00 EUR
            currency: 'EUR',
            photos: [{ url: 'https://picsum.photos/seed/denim/600/600', isCover: true }],
            tags: ['jacket','denim']
        },
        {
            sellerId: userId,
            title: 'Nike Air Max 90',
            description: 'Κατάσταση EXCELLENT',
            condition: 'EXCELLENT',
            price: 6500,
            currency: 'EUR',
            photos: [{ url: 'https://picsum.photos/seed/airmax/600/600', isCover: true }],
            tags: ['shoes','nike']
        }
    ]);
}
module.exports = { seedListings };
