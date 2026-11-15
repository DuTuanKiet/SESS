const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = authMiddleware;
const { USER_ROLES } = require('../utils/constants');
const validate = require('../middlewares/validateMiddleware');
const {
  newsIdParamsSchema,
  newsIdOrSlugParamsSchema,
  newsListQuerySchema,
  createNewsBodySchema,
  updateNewsBodySchema,
} = require('../validations/newsValidation');

/** GET /api/v1/news - public */
router.get('/', validate({ query: newsListQuerySchema }), newsController.getNews);

/** GET /api/v1/news/:idOrSlug - public */
router.get('/:idOrSlug', validate({ params: newsIdOrSlugParamsSchema }), newsController.getNewsById);

/** POST /api/v1/news (Admin) */
router.post(
  '/',
  authMiddleware,
  checkRole(USER_ROLES.ADMIN),
  validate({ body: createNewsBodySchema }),
  newsController.createNews,
);

/** PUT /api/v1/news/:id (Admin) */
router.put(
  '/:id',
  authMiddleware,
  checkRole(USER_ROLES.ADMIN),
  validate({ params: newsIdParamsSchema, body: updateNewsBodySchema }),
  newsController.updateNews,
);

/** DELETE /api/v1/news/:id (Admin) */
router.delete(
  '/:id',
  authMiddleware,
  checkRole(USER_ROLES.ADMIN),
  validate({ params: newsIdParamsSchema }),
  newsController.deleteNews,
);

module.exports = router;
