const express = require('express');
const router = express.Router();
const ApiError = require('../utils/apiError');

/**
 * Legacy project-centric evaluation endpoints are DISABLED to avoid dual-pipeline scoring.
 * Use unified pipeline:
 * - Admin assignment: POST /api/v1/admin/evaluations/assign
 * - Judge workspace/submit: /api/v1/evaluator/*
 */
router.use((_req, _res, next) => {
  next(ApiError.gone
    ? ApiError.gone('Legacy evaluation endpoints are disabled. Use /api/v1/admin/evaluations/assign and /api/v1/evaluator/*.', 'LEGACY_EVALUATION_DISABLED')
    : Object.assign(new Error('Legacy evaluation endpoints are disabled. Use /api/v1/admin/evaluations/assign and /api/v1/evaluator/*.'), { statusCode: 410, code: 'LEGACY_EVALUATION_DISABLED' }));
});

module.exports = router;
