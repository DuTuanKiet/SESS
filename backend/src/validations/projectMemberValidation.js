const { z } = require('zod');
const {
  PROJECT_MEMBER_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
} = require('../utils/constants');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const projectParamsSchema = z.object({ id: objectIdSchema }).strict();
const invitationParamsSchema = z.object({ invitationId: objectIdSchema }).strict();
const changeRequestParamsSchema = z.object({ requestId: objectIdSchema }).strict();
const memberParamsSchema = z.object({ id: objectIdSchema, userId: objectIdSchema }).strict();
const invitationIdentifierParamsSchema = z
  .object({
    id: objectIdSchema,
    identifier: z.union([
      objectIdSchema,
      z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    ]),
  })
  .strict();

const inviteMemberBodySchema = z
  .object({
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  })
  .strict();
const respondInvitationBodySchema = z
  .object({ response: z.enum([PROJECT_MEMBER_STATUS.ACCEPTED, PROJECT_MEMBER_STATUS.REJECTED]) })
  .strict();
const transferOwnershipBodySchema = z.object({ userId: objectIdSchema }).strict();
const requestLeaveBodySchema = z
  .object({ reason: z.string().trim().min(10).max(1000) })
  .strict();
const memberChangeBodySchema = z
  .object({
    targetUserId: objectIdSchema,
    type: z.enum(Object.values(MEMBER_CHANGE_REQUEST_TYPE)),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();
const respondMemberChangeBodySchema = z
  .object({
    response: z.enum([MEMBER_CHANGE_REQUEST_STATUS.APPROVED, MEMBER_CHANGE_REQUEST_STATUS.REJECTED]),
    responseReason: z.string().trim().max(1000).optional(),
  })
  .strict();
const emergencyTransferBodySchema = z
  .object({ targetUserId: objectIdSchema, reason: z.string().trim().min(1).max(1000) })
  .strict();
const memberChangeQuerySchema = z
  .object({
    status: z.enum(Object.values(MEMBER_CHANGE_REQUEST_STATUS)).optional(),
    type: z.enum(Object.values(MEMBER_CHANGE_REQUEST_TYPE)).optional(),
  })
  .strict();

module.exports = {
  projectParamsSchema,
  invitationParamsSchema,
  changeRequestParamsSchema,
  memberParamsSchema,
  invitationIdentifierParamsSchema,
  inviteMemberBodySchema,
  respondInvitationBodySchema,
  transferOwnershipBodySchema,
  requestLeaveBodySchema,
  memberChangeBodySchema,
  respondMemberChangeBodySchema,
  emergencyTransferBodySchema,
  memberChangeQuerySchema,
};
