const { z } = require('zod');

const updateUserRolesSchema = z.object({
    roles: z.array(z.enum(['USER','ADMIN','SELLER'])).min(1)
});

const profileUpdateSchema = z.object({
    name: z.string().min(2).max(60).optional(),
    avatarUrl: z.string().url().optional(),
    location: z.string().max(120).optional(),
    bio: z.string().max(300).optional()
});

module.exports = { updateUserRolesSchema, profileUpdateSchema };
