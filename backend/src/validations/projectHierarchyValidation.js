const { z } = require('zod');
const { PROJECT_LEVEL } = require('../utils/constants');

/**
 * Zod validation schemas cho cấu trúc thi đấu đa cấp (Parent-Child Projects).
 */

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

/** Params: /projects/:projectId/promote | /projects/:projectId/hierarchy */
const projectHierarchyParamsSchema = z.object({
  projectId: objectIdSchema,
});

/** Body: đề xuất thi vượt cấp */
const promoteProjectBodySchema = z.object({
  targetLevel: z.nativeEnum(PROJECT_LEVEL, {
    errorMap: () => ({
      message: `Cấp đích không hợp lệ. Cho phép: ${Object.values(PROJECT_LEVEL).join(', ')}`,
    }),
  }),
});

module.exports = {
  projectHierarchyParamsSchema,
  promoteProjectBodySchema,
};
