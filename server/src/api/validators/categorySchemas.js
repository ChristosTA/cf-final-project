const { z } = require('zod');

const createCategorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(1).optional(),
    parentId: z.string().optional()
});

const updateCategorySchema = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(1).optional(),
    parentId: z.string().optional().nullable()
});

module.exports = { createCategorySchema, updateCategorySchema };
