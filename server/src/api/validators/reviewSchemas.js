const { z } = require('zod');

const createReviewSchema = z.object({
    orderId: z.string().min(1),
    rating:  z.number().int().min(1).max(5),
    comment: z.string().trim().min(1).max(1000)
});


const updateReviewSchema = z.object({
    rating: z.preprocess(
        // Αν έρθει κενό string, το μετατρέπουμε σε undefined για να μην κοπεί άσκοπα
        (v) => (v === '' || v === null ? undefined : v),
        z.number({ invalid_type_error: 'rating must be a number' })
            .int()
            .min(1, 'min rating 1')
            .max(5, 'max rating 5')
    ).optional(),

    comment: z.preprocess(
        (v) => (typeof v === 'string' ? v.trim() : v),
        z.string().min(1, 'comment required').max(1000, 'comment too long')
    ).optional()
})
    .refine(
        (data) => typeof data.rating !== 'undefined' || typeof data.comment !== 'undefined',
        { message: 'Provide rating and/or comment' }
    );



module.exports = { createReviewSchema, updateReviewSchema };
