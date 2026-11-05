function createLegacyEvaluationDeprecationMiddleware(routeLabel) {
  return (req, res, next) => {
    const message =
      `[DEPRECATED][Evaluation] ${routeLabel} is legacy (EvaluationSubmission/project-centric). ` +
      'Use unified HumanEvaluation pipeline: /api/v1/admin/evaluations/assign and /api/v1/evaluator/*.';
    console.warn(message, {
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id || null,
      ip: req.ip,
      at: new Date().toISOString(),
    });
    res.setHeader('X-Legacy-Evaluation-Endpoint', 'true');
    res.setHeader('X-Unified-Evaluation-Pipeline', 'HumanEvaluation');
    next();
  };
}

module.exports = {
  createLegacyEvaluationDeprecationMiddleware,
};