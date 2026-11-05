const ProjectFeedback = require('../models/ProjectFeedback');

async function handleCreateFeedback(req, res, next) {
  try {
    const { projectId } = req.params;
    const { content } = req.body;
    const mentorId = req.user.id || req.user._id;
    const doc = await ProjectFeedback.create({ projectId, mentorId, content });
    const populated = await ProjectFeedback.findById(doc._id).populate('mentorId', 'fullName email role').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (e) { next(e); }
}

async function handleGetFeedbacks(req, res, next) {
  try {
    const { projectId } = req.params;
    const list = await ProjectFeedback.find({ projectId })
      .populate('mentorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: list });
  } catch (e) { next(e); }
}

module.exports = { handleCreateFeedback, handleGetFeedbacks };
