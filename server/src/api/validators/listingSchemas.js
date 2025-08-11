const { z } = require('zod');

const listQuerySchema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    condition: z.enum(['NEW_WITH_TAGS','NEW','EXCELLENT','GOOD','FAIR']).optional(),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().nonnegative().optional(),
    sort: z.enum(['newest','price_asc','price_desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
});

const createListingSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    condition: z.enum(['NEW_WITH_TAGS','NEW','EXCELLENT','GOOD','FAIR']).optional(),
    price: z.number().positive(),
    currency: z.string().length(3).default('EUR'),
    categoryId: z.string().optional(),
    photos: z.array(z.object({
        url: z.string().url(),
        isCover: z.boolean()
    })).optional(),
    tags: z.array(z.string()).optional()
});

const updateListingSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    condition: z.enum(['NEW_WITH_TAGS','NEW','EXCELLENT','GOOD','FAIR']).optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    categoryId: z.string().optional(),
    photos: z.array(z.object({
        url: z.string().url(),
        isCover: z.boolean().optional()
    })).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['ACTIVE','RESERVED','SOLD','HIDDEN']).optional() // αν θες να το αλλάζει
});

module.exports = { listQuerySchema, createListingSchema, updateListingSchema };
