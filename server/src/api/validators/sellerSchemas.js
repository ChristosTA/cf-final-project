const { z } = require('zod');

const addressSchema = z.object({
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(2),
});

const sellerProfileSchema = z.object({
    shopName: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    phone: z.string().min(4).max(20).optional(),
    addresses: z.array(addressSchema).default([]),
});

const billingSchema = z.object({
    legalName: z.string().min(2),
    vatNumber: z.string().min(5),
    iban: z.string().min(8),
    billingAddress: addressSchema
});

const updateSellerProfileSchema = sellerProfileSchema.partial(); // PUT me/profile (partial updates)
const updateBillingSchema = billingSchema;                       // PUT me/billing (πλήρες)

module.exports = { updateSellerProfileSchema, updateBillingSchema };
