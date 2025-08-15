const { z } = require('zod');

const createOrderSchema = z.object({
    listingId: z.string().min(1)
});

const listOrdersQuerySchema = z.object({
    role: z.enum(['buyer','seller']).optional(),
    status: z.enum(['REQUESTED','ACCEPTED','DECLINED','CANCELLED','COMPLETED']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional()
});

const postMessageSchema = z.object({
    text: z.string().trim().min(1, 'required').max(2000)
});

module.exports = { createOrderSchema, listOrdersQuerySchema, postMessageSchema  };
