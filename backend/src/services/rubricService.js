const mongoose = require('mongoose');
const EvaluationRubric = require('../models/EvaluationRubric');
const { createAuditLog } = require('./auditService');
const { createError } = require('../middlewares/errorHandler');
const { calcTotalWeight, validateScoreRange } = require('../validations/rubricValidation');
const { RUBRIC_STATUS, AUDIT_ACTIONS, AUDIT_ENTITIES } = require('../utils/constants');

// Tìm kiếm bộ tiêu chí theo ID, ném lỗi 404 nếu không tìm thấy.
async function _findRubricById(rubricId, session = null) {
  const query = EvaluationRubric.findById(rubricId);
  if (session) query.session(session);
  const rubric = await query;
  if (!rubric) throw createError('Bộ tiêu chí không tồn tại.', 404, 'RUBRIC_NOT_FOUND');
  return rubric;
}
/**
 * ENGINE ĐIỀU PHỐI VÒNG ĐỜI & THAY ĐỔI DỮ LIỆU TẬP TRUNG
 * - Chặn sửa bộ tiêu chí đã Deprecated.
 * - Active: Tự động clone Version mới trong Transaction, deprecate bản cũ, ghi AuditLog.
 * - Draft: Cập nhật trực tiếp trên bản ghi hiện tại (không ghi AuditLog).
 */
async function _applyRubricMutation({ rubric, changes: { name, description, criteria }, adminId, actionDetail }) {
  if (rubric.status === RUBRIC_STATUS.DEPRECATED) {
    throw createError('Không thể chỉnh sửa bộ tiêu chí đã lưu trữ (Deprecated).', 400, 'CANNOT_MODIFY_DEPRECATED');
  }
  const updated = {
    name: name || rubric.name,
    description: description !== undefined ? description : rubric.description,
    criteria: criteria || rubric.criteria.map((c) => c.toObject()),
  };
  const totalWeight = calcTotalWeight(updated.criteria);
  // Nhánh 1: Rubric đang Active -> Nhân bản Version mới trong Transaction
  if (rubric.status === RUBRIC_STATUS.ACTIVE) {
    const session = await mongoose.startSession();
    try {
      let newRubric;
      await session.withTransaction(async () => {
        const rootId = rubric.rootRubricId || rubric._id;
        const latest = await EvaluationRubric.findOne({ rootRubricId: rootId })
          .sort({ version: -1 })
          .session(session)
          .lean();

        const [created] = await EvaluationRubric.create(
          [
            {
              ...updated,
              totalWeight,
              version: (latest?.version || rubric.version) + 1,
              rootRubricId: rootId,
              previousVersionId: rubric._id,
              status: RUBRIC_STATUS.DRAFT,
              createdBy: adminId,
            },
          ],
          { session }
        );
        newRubric = created;

        rubric.status = RUBRIC_STATUS.DEPRECATED;
        await rubric.save({ session });

        await createAuditLog({
          userId: adminId,
          action: AUDIT_ACTIONS.CHANGE_RUBRIC,
          targetEntity: AUDIT_ENTITIES.EVALUATION_RUBRICS,
          targetId: newRubric._id,
          oldValues: { id: rubric._id, version: rubric.version, status: rubric.status },
          newValues: { id: newRubric._id, version: newRubric.version, status: newRubric.status, actionDetail },
          session,
        });
      });
      return newRubric;
    } finally {
      await session.endSession();
    }
  }

  // Nhánh 2: Rubric đang Draft -> Cập nhật trực tiếp (không ghi AuditLog)
  Object.assign(rubric, updated, { totalWeight });
  await rubric.save();

  return rubric;
}

// Tạo bộ tiêu chí mới (Draft v1) - KHÔNG GHI AUDITLOG
async function createRubric({ name, description, criteria = [], adminId }) {
  criteria.forEach((c) => validateScoreRange(c.minScore ?? 0, c.maxScore ?? 10));
  const rubric = new EvaluationRubric({
    name,
    description,
    criteria,
    totalWeight: calcTotalWeight(criteria),
    version: 1,
    status: RUBRIC_STATUS.DRAFT,
    createdBy: adminId,
  });
  rubric.rootRubricId = rubric._id;
  return rubric.save();
}

// Cập nhật thông tin bộ tiêu chí
async function updateRubric({ rubricId, name, description, criteria, adminId }) {
  const rubric = await _findRubricById(rubricId);
  if (criteria) criteria.forEach((c) => validateScoreRange(c.minScore ?? 0, c.maxScore ?? 10));
  return _applyRubricMutation({ rubric, changes: { name, description, criteria }, adminId, actionDetail: 'UPDATE_RUBRIC' });
}

// Thêm tiêu chí con vào bộ tiêu chí
async function addCriterion({ rubricId, criterionData, adminId }) {
  const rubric = await _findRubricById(rubricId);
  validateScoreRange(criterionData.minScore ?? 0, criterionData.maxScore ?? 10);
  return _applyRubricMutation({
    rubric,
    changes: { criteria: [...rubric.criteria.map((c) => c.toObject()), criterionData] },
    adminId,
    actionDetail: `ADD_CRITERION: ${criterionData.name}`,
  });
}

// Sửa tiêu chí con trong bộ tiêu chí
async function updateCriterion({ rubricId, criterionId, updateData, adminId }) {
  const rubric = await _findRubricById(rubricId);
  const criterion = rubric.criteria.id(criterionId);
  if (!criterion) throw createError('Tiêu chí con không tồn tại.', 404, 'CRITERION_NOT_FOUND');

  validateScoreRange(updateData.minScore ?? criterion.minScore, updateData.maxScore ?? criterion.maxScore);
  const criteria = rubric.criteria.map((c) => (c._id.toString() === criterionId ? { ...c.toObject(), ...updateData } : c.toObject()));
  return _applyRubricMutation({ rubric, changes: { criteria }, adminId, actionDetail: `UPDATE_CRITERION: ${criterionId}` });
}
// Xóa tiêu chí con khỏi bộ tiêu chí

async function deleteCriterion({ rubricId, criterionId, adminId }) {
  const rubric = await _findRubricById(rubricId);
  const criterion = rubric.criteria.id(criterionId);
  if (!criterion) throw createError('Tiêu chí con không tồn tại.', 404, 'CRITERION_NOT_FOUND');

  const criteria = rubric.criteria.filter((c) => c._id.toString() !== criterionId).map((c) => c.toObject());
  return _applyRubricMutation({ rubric, changes: { criteria }, adminId, actionDetail: `DELETE_CRITERION: ${criterion.name}` });
}
//Kích hoạt bộ tiêu chí (Ràng buộc tổng trọng số = 100%)
async function activateRubric({ rubricId, adminId }) {
  const rubric = await _findRubricById(rubricId);

  if (rubric.status === RUBRIC_STATUS.DEPRECATED) throw createError('Không thể kích hoạt bộ tiêu chí đã lưu trữ.', 400, 'CANNOT_ACTIVATE_DEPRECATED');
  if (rubric.status === RUBRIC_STATUS.ACTIVE) throw createError('Bộ tiêu chí này hiện đã ở trạng thái kích hoạt.', 400, 'ALREADY_ACTIVE');
  if (!rubric.criteria?.length) throw createError('Bộ tiêu chí phải có ít nhất 1 tiêu chí đánh giá.', 422, 'EMPTY_CRITERIA');

  const total = calcTotalWeight(rubric.criteria);
  if (total !== 100) {
    throw createError(`Tổng trọng số phải bằng 100% để kích hoạt. Hiện tại là ${total}%.`, 422, 'INVALID_TOTAL_WEIGHT');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await EvaluationRubric.updateMany(
        { rootRubricId: rubric.rootRubricId, status: RUBRIC_STATUS.ACTIVE, _id: { $ne: rubric._id } },
        { $set: { status: RUBRIC_STATUS.DEPRECATED } },
        { session }
      );
      rubric.status = RUBRIC_STATUS.ACTIVE;
      rubric.totalWeight = 100;
      await rubric.save({ session });

      await createAuditLog({
        userId: adminId,
        action: AUDIT_ACTIONS.CHANGE_RUBRIC,
        targetEntity: AUDIT_ENTITIES.EVALUATION_RUBRICS,
        targetId: rubric._id,
        oldValues: { status: RUBRIC_STATUS.DRAFT },
        newValues: { status: RUBRIC_STATUS.ACTIVE, version: rubric.version },
        session,
      });
    });
    return rubric;
  } finally {
    await session.endSession();
  }
}
//Lấy danh sách bộ tiêu chí có phân trang và bộ lọc
async function getRubrics({ page = 1, limit = 10, status, keyword } = {}) {
  const query = {
    ...(status && { status }),
    ...(keyword && { name: { $regex: keyword, $options: 'i' } }),
  };
  const skip = (page - 1) * limit;
  const [rubrics, totalRecords] = await Promise.all([
    EvaluationRubric.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    EvaluationRubric.countDocuments(query),
  ]);
  return { rubrics, pagination: { currentPage: page, totalPages: Math.ceil(totalRecords / limit), totalRecords } };
}
//Lấy chi tiết bộ tiêu chí theo ID
async function getRubricById(rubricId) {
  return _findRubricById(rubricId);
}
//Lấy lịch sử phiên bản của một bộ tiêu chí
async function getRubricVersions(rubricId) {
  const rubric = await _findRubricById(rubricId);
  return EvaluationRubric.find({ rootRubricId: rubric.rootRubricId || rubric._id }).sort({ version: -1 }).lean();
}
module.exports = {
  createRubric,
  updateRubric,
  addCriterion,
  updateCriterion,
  deleteCriterion,
  activateRubric,
  getRubrics,
  getRubricById,
  getRubricVersions,
};
