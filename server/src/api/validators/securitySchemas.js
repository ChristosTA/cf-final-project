const { z } = require('zod');

const changePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
});

const refreshSchema = z.object({
    refreshToken: z.string().min(20)
});

const recoveryRequestSchema = z.object({
    email: z.string().email()
});

const recoveryConfirmSchema = z.object({
    token: z.string().min(10),
    password: z.string().min(6)
});

module.exports = {
    changePasswordSchema,
    refreshSchema,
    recoveryRequestSchema,
    recoveryConfirmSchema
};
