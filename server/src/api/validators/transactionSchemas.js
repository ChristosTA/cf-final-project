const { z } = require('zod');

// Δεν ζητάμε amount στο authorize/capture (MVP = full amount από order)
const authorizePaymentSchema = z.object({
    provider: z.string().trim().default('mock').optional(),
    meta: z.record(z.any()).optional()
});

const capturePaymentSchema = z.object({
    provider: z.string().trim().default('mock').optional(),
    meta: z.record(z.any()).optional()
});

const refundPaymentSchema = z.object({
    // Επιτρέπουμε full refund αν δεν δοθεί amount
    amount: z.number().positive().optional(),
    reason: z.string().trim().optional(),
    provider: z.string().trim().default('mock').optional(),
    meta: z.record(z.any()).optional()
});

module.exports = {
    authorizePaymentSchema,
    capturePaymentSchema,
    refundPaymentSchema
};
