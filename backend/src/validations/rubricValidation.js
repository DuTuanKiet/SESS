const { z } = require('zod');
const { createError } = require('../middlewares/errorHandler');

//Tính tổng trọng số danh sách tiêu chí
const calcTotalWeight = (criteria = []) =>
  criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
//Kiểm tra nghiệp vụ: minScore phải nhỏ hơn maxScore

function validateScoreRange(minScore, maxScore) {
  if (minScore !== undefined && maxScore !== undefined && Number(minScore) >= Number(maxScore)) {
    throw createError(
      `Điểm tối thiểu (${minScore}) phải nhỏ hơn điểm tối đa (${maxScore}).`,
      400,
      'INVALID_SCORE_RANGE'
    );
  }
}

const objectIdSchema = z
  .string({ required_error: 'ID không được để trống.' })
  .regex(/^[a-f\d]{24}$/i, { message: 'ID không đúng định dạng ObjectId.' });

const criterionRawShape = {
  name: z
    .string({ required_error: 'Tên tiêu chí là bắt buộc.' })
    .min(2, 'Tên tiêu chí ít nhất 2 ký tự.')
    .max(200)
    .trim(),
  description: z.string().optional().default(''),
  weight: z
    .number({ required_error: 'Trọng số là bắt buộc.' })
    .int('Trọng số phải là số nguyên.')
    .min(1, 'Trọng số >= 1.')
    .max(100, 'Trọng số <= 100.'),
  minScore: z.number().min(0, 'minScore >= 0.').default(0),
  maxScore: z.number().min(1, 'maxScore >= 1.').default(10),
  order: z.number().int().min(0).default(0),
};

const validateScoreRangeSafe = (d) =>
  d.minScore !== undefined && d.maxScore !== undefined ? d.minScore < d.maxScore : true;
const scoreRangeError = {
  message: 'Điểm tối thiểu (minScore) phải nhỏ hơn điểm tối đa (maxScore).',
  path: ['minScore'],
};

const criterionBaseSchema = z.object(criterionRawShape).refine(validateScoreRangeSafe, scoreRangeError);

const criterionUpdateShape = {
  name: z.string().min(2, 'Tên tiêu chí ít nhất 2 ký tự.').max(200).trim(),
  description: z.string().optional(),
  weight: z.number().int('Trọng số phải là số nguyên.').min(1, 'Trọng số >= 1.').max(100, 'Trọng số <= 100.'),
  minScore: z.number().min(0, 'minScore >= 0.'),
  maxScore: z.number().min(1, 'maxScore >= 1.'),
  order: z.number().int().min(0),
};

const updateCriterionBodySchema = z
  .object(criterionUpdateShape)
  .partial()
  .refine(validateScoreRangeSafe, scoreRangeError);

const rubricIdParamsSchema = z.object({ rubricId: objectIdSchema });
const criterionParamsSchema = z.object({ rubricId: objectIdSchema, criterionId: objectIdSchema });

const createRubricBodySchema = z.object({
  name: z
    .string({ required_error: 'Tên bộ tiêu chí là bắt buộc.' })
    .min(3, 'Tên ít nhất 3 ký tự.')
    .max(200)
    .trim(),
  description: z.string().optional().default(''),
  criteria: z.array(criterionBaseSchema).optional().default([]),
});

const updateRubricBodySchema = z.object({
  name: z.string().min(3).max(200).trim().optional(),
  description: z.string().optional(),
  criteria: z.array(criterionBaseSchema).optional(),
});

const getRubricsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).refine((v) => v >= 1, 'page >= 1.'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .refine((v) => v >= 1 && v <= 100, 'limit 1-100.'),
  status: z.enum(['Draft', 'Active', 'Deprecated']).optional(),
  keyword: z.string().optional(),
});

module.exports = {
  calcTotalWeight,
  validateScoreRange,
  objectIdSchema,
  rubricIdParamsSchema,
  criterionParamsSchema,
  createRubricBodySchema,
  updateRubricBodySchema,
  addCriterionBodySchema: criterionBaseSchema,
  updateCriterionBodySchema,
  getRubricsQuerySchema,
};
