const { z } = require('zod');

const updateUserRolesSchema = z.object({
    roles: z.array(z.enum(['USER','ADMIN','SELLER'])).min(1)
});

module.exports = { updateUserRolesSchema };
