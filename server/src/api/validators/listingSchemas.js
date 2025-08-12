const { z } = require('zod');

// helper: δέχεται string ή array από strings και πάντα γυρίζει array
function categoriesField() {
    return z
        .union([
            z.string(),                 // "hoodie"  ή  "5"  ή  "3122d3c7-..."
            z.array(z.string()).min(1)  // ["hoodie","1","..."]
        ])
        .transform(v => (Array.isArray(v) ? v : [v]));
}

const CONDITION = ['NEW_WITH_TAGS','NEW','EXCELLENT','GOOD','FAIR'];
const STATUS = ['ACTIVE','RESERVED','SOLD','HIDDEN'];

const createListingSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    condition: z.enum(CONDITION).optional(),
    price: z.number().positive(),
    currency: z.string().length(3).default('EUR'),
    tags: z.array(z.string()).optional(),
    // string ή array (serial | uuid | _id | slug) -> πάντα array
    categories: categoriesField().optional()
});

const updateListingSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    condition: z.enum(CONDITION).optional(),
    price: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(STATUS).optional(),
    categories: categoriesField().optional()
});

// Query parser: δέχεται categories ως repeated (?categories=A&categories=B)
// ή ως comma string (?categories=A,B) και το κάνει array
const listQuerySchema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    categories: z.preprocess((v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') {
            // υποστήριξη "A,B,C"
            return v.split(',').map(s => s.trim()).filter(Boolean);
        }
        return undefined;
    }, z.array(z.string()).optional()),
    categoryMode: z.enum(['any','all']).optional(),
    includeChildren: z.coerce.boolean().optional(),
    condition: z.enum(CONDITION).optional(),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().nonnegative().optional(),
    sort: z.enum(['newest','price_asc','price_desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
});

module.exports = { createListingSchema, updateListingSchema, listQuerySchema };
