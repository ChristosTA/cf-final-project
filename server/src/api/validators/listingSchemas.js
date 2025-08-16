const { z } = require('zod');

// helper: δέχεται "a,b,c" ή ["a","b","c"] και επιστρέφει πάντα array
const csvOrArray = z.preprocess(v => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return undefined;
}, z.array(z.string()).optional());

// Προσοχή: condition είναι κατάσταση ΠΡΟΪΟΝΤΟΣ (όχι listing status)
const CONDITION = ['NEW_WITH_TAGS', 'NEW', 'EXCELLENT', 'GOOD', 'FAIR'];

const listQuerySchema = z.object({
    q: z.string().optional(),
    categories: csvOrArray,
    categoryMode: z.enum(['any', 'all']).optional(),
    includeChildren: z.coerce.boolean().optional(),
    condition: z
        .enum(CONDITION)
        .or(z.string())
        .transform(v => v.toString().trim().toUpperCase())
        .refine(v => CONDITION.includes(v), { message: 'Invalid condition' })
        .optional(),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().nonnegative().optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    seller: z.string().optional(),
});

const createListingSchema = z.object({
    title: z.string().min(1),
    price: z.coerce.number().positive(),
    condition: z.enum(CONDITION).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
});

const updateListingSchema = createListingSchema.partial();

module.exports = { createListingSchema, updateListingSchema, listQuerySchema };
