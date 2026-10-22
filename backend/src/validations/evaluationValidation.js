const { z } = require('zod');

/**
 * Zod validation schemas cho vòng chấm điểm Rubric (trạng thái EVALUATED).
 */

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

/** Params: /projects/:projectId/evaluation... */
const evaluationParamsSchema = z.object({
  projectId: objectIdSchema,
});

/** Body: gán giám khảo vào tiểu ban */
const assignJudgeBodySchema = z.object({
  judgeId: objectIdSchema,
});

/** Body: giám khảo nộp phiếu chấm điểm */
const submitScoreBodySchema = z.object({
  rubricId: objectIdSchema,
  criterionId: objectIdSchema,
  score: z
    .number({ invalid_type_error: '"score" phải là số.' })
    .finite('"score" phải là số hữu hạn.')
    .min(0, { message: 'Điểm không được nhỏ hơn 0.' })
    .max(100, { message: 'Điểm không được lớn hơn 100.' }),
  comment: z
    .string()
    .trim()
    .max(2000, { message: 'Nhận xét không được vượt quá 2000 ký tự.' })
    .optional(),
});

module.exports = {
  evaluationParamsSchema,
  assignJudgeBodySchema,
  submitScoreBodySchema,
};
