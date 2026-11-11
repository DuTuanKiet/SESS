const projectSubmissionService = require('../services/projectSubmissionService');

async function getProjectSubmissions(req, res) {
  const data = await projectSubmissionService.getProjectSubmissions({
    projectId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: 'Lấy hồ sơ các vòng thi thành công.',
    data,
  });
}

async function updateProjectSubmissions(req, res) {
  const data = await projectSubmissionService.updateProjectSubmissions({
    projectId: req.params.id,
    userId: req.user.id,
    roundId: req.body.roundId,
    items: req.body.items,
  });

  res.status(200).json({
    success: true,
    message: 'Cập nhật hồ sơ vòng thi thành công.',
    data,
  });
}

module.exports = {
  getProjectSubmissions,
  updateProjectSubmissions,
};
