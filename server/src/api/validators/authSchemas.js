const { z } = require('zod');

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    name: z.string().optional(),
    password: z.string().min(6)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

module.exports = { registerSchema, loginSchema };
