const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const createEmergencyReassignmentBodySchema = z.object({
  projectId: objectIdSchema,
  originalJudgeId: objectIdSchema,
  replacementJudgeId: objectIdSchema,
  reason: z.string().trim().min(10, 'Lý do điều chuyển khẩn cấp là bắt buộc.').max(1000),
  faculty: z.string().trim().max(200).optional(),
}).passthrough();

const emergencyReassignmentQuerySchema = z.object({
  projectId: objectIdSchema.optional(),
  status: z.string().trim().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).passthrough();

const emergencyReassignmentParamsSchema = z.object({ reassignmentId: objectIdSchema });

const revokeEmergencyReassignmentBodySchema = z.object({
  revokeReason: z.string().trim().min(5, 'Lý do thu hồi là bắt buộc.').max(1000),
}).passthrough();

module.exports = {
  createEmergencyReassignmentBodySchema,
  emergencyReassignmentQuerySchema,
  emergencyReassignmentParamsSchema,
  revokeEmergencyReassignmentBodySchema,
};
