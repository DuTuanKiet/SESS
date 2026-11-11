const { z } = require('zod');

const optionalUrlSchema = z.string().trim().refine(
  (value) => value === '' || z.string().url().safeParse(value).success,
  'URL không hợp lệ.',
);

const socialLinksSchema = z.object({
  facebook: optionalUrlSchema.optional(),
  github: optionalUrlSchema.optional(),
  linkedin: optionalUrlSchema.optional(),
  website: optionalUrlSchema.optional(),
}).strict();

const updateMyProfileBodySchema = z.object({
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().trim().min(1)).max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  avatarUrl: optionalUrlSchema.optional(),
  socialLinks: socialLinksSchema.optional(),
}).strict();

module.exports = { updateMyProfileBodySchema };
