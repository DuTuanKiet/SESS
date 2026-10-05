const rubricService = require('../services/rubricService');

const send = (res, status, code, message, data) =>
  res.status(status).json({ success: true, code, message, data });

//Tạo mới bộ tiêu chí (Draft v1).
// @route POST /api/v1/evaluation-rubrics
async function handleCreateRubric(req, res, next) {
  try {
    const data = await rubricService.createRubric({ ...req.body, adminId: req.user.id });
    return send(res, 201, 'RUBRIC_CREATED', 'Tạo bộ tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

//Lấy danh sách bộ tiêu chí.
// @route GET /api/v1/evaluation-rubrics
async function handleGetRubrics(req, res, next) {
  try {
    const data = await rubricService.getRubrics(req.query);
    return send(res, 200, 'RUBRICS_FETCHED', 'Lấy danh sách bộ tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

//Lấy thông tin chi tiết một bộ tiêu chí theo ID.
// @route GET /api/v1/evaluation-rubrics/:rubricId
async function handleGetRubricById(req, res, next) {
  try {
    const data = await rubricService.getRubricById(req.params.rubricId);
    return send(res, 200, 'RUBRIC_FETCHED', 'Lấy chi tiết bộ tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

//Lấy danh sách các phiên bản của bộ tiêu chí.
// @route GET /api/v1/evaluation-rubrics/:rubricId/versions
async function handleGetRubricVersions(req, res, next) {
  try {
    const data = await rubricService.getRubricVersions(req.params.rubricId);
    return send(res, 200, 'VERSIONS_FETCHED', 'Lấy danh sách phiên bản thành công.', data);
  } catch (e) {
    next(e);
  }
}

// Cập nhật thông tin bộ tiêu chí.
// @route PUT /api/v1/evaluation-rubrics/:rubricId
async function handleUpdateRubric(req, res, next) {
  try {
    const data = await rubricService.updateRubric({
      rubricId: req.params.rubricId,
      ...req.body,
      adminId: req.user.id,
    });
    return send(res, 200, 'RUBRIC_UPDATED', 'Cập nhật bộ tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

// Thêm tiêu chí con vào bộ tiêu chí.
// @route POST /api/v1/evaluation-rubrics/:rubricId/criteria
async function handleAddCriterion(req, res, next) {
  try {
    const data = await rubricService.addCriterion({
      rubricId: req.params.rubricId,
      criterionData: req.body,
      adminId: req.user.id,
    });
    return send(res, 200, 'CRITERION_ADDED', 'Thêm tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

// Cập nhật tiêu chí con trong bộ tiêu chí.
// @route PUT /api/v1/evaluation-rubrics/:rubricId/criteria/:criterionId
async function handleUpdateCriterion(req, res, next) {
  try {
    const { rubricId, criterionId } = req.params;
    const data = await rubricService.updateCriterion({
      rubricId,
      criterionId,
      updateData: req.body,
      adminId: req.user.id,
    });
    return send(res, 200, 'CRITERION_UPDATED', 'Cập nhật tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

// Xóa tiêu chí con khỏi bộ tiêu chí.
// @route DELETE /api/v1/evaluation-rubrics/:rubricId/criteria/:criterionId
async function handleDeleteCriterion(req, res, next) {
  try {
    const { rubricId, criterionId } = req.params;
    const data = await rubricService.deleteCriterion({
      rubricId,
      criterionId,
      adminId: req.user.id,
    });
    return send(res, 200, 'CRITERION_DELETED', 'Xóa tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

// Kích hoạt bộ tiêu chí (yêu cầu tổng trọng số = 100%).
// @route PATCH /api/v1/evaluation-rubrics/:rubricId/activate
async function handleActivateRubric(req, res, next) {
  try {
    const data = await rubricService.activateRubric({
      rubricId: req.params.rubricId,
      adminId: req.user.id,
    });
    return send(res, 200, 'RUBRIC_ACTIVATED', 'Kích hoạt bộ tiêu chí thành công.', data);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  handleCreateRubric,
  handleGetRubrics,
  handleGetRubricById,
  handleGetRubricVersions,
  handleUpdateRubric,
  handleAddCriterion,
  handleUpdateCriterion,
  handleDeleteCriterion,
  handleActivateRubric,
};
