const { z } = require('zod');

const addressSchema = z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(2).max(3),
    postalCode: z.string().min(3).max(5),
});

const updateProfileSchema = z.object({
    legalName: z.string().trim().min(2),
    phone: z.string().trim().min(6).max(30),
    addresses: z.array(addressSchema).min(1)
});

const updateBillingSchema = z.object({
    legalName: z.string().trim().min(2),
    taxId: z.string().trim().min(5).max(32),     // π.χ. EL123456789 – κρατάμε χαλαρό κανόνα
    address: addressSchema,
    iban: z.string().trim().optional()           // αν θες αυστηρό IBAN, βάλε regex / length check
});

module.exports = {
    addressSchema,
    updateProfileSchema,
    updateBillingSchema
};
