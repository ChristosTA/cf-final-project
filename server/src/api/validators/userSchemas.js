const { z } = require('zod');

const updateUserRolesSchema = z.object({
    roles: z.array(z.enum(['USER','ADMIN','SELLER'])).min(1)
});

const profileUpdateSchema = z.object({
    name: z.string().min(2).max(60).optional(),
    avatarUrl: z.string().url().optional(),
    location: z.string().max(120).optional(),
    bio: z.string().max(300).optional()
});

const addressSchema = z.object({
    fullName: z.string().min(1).optional(),
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    region: z.string().optional(),
    postalCode: z.string().min(2),
    country: z.string().min(2).default('GR')
});

const updateSellerProfileSchema = z.object({
    businessName: z.string().min(2).optional(),
    billingAddress: addressSchema
});

module.exports = { updateUserRolesSchema, profileUpdateSchema, updateSellerProfileSchema };
