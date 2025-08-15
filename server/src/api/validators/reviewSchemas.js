const { z } = require('zod');

const createReviewSchema = z.object({
    orderId: z.string().min(1),
    rating:  z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1000)
});

module.exports = { createReviewSchema };
