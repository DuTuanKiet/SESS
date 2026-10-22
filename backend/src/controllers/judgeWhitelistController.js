const judgeWhitelistService = require('../services/judgeWhitelistService');
const { z } = require('zod');

/** Schema params ID whitelist */
const judgeWhitelistIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId.' }),
});

/** Schema query danh sách whitelist */
const getJudgeWhitelistQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).refine((v) => v >= 1, 'page >= 1.'),
  limit: z.string().optional().default('20').transform(Number).refine((v) => v >= 1 && v <= 100, 'limit 1-100.'),
  keyword: z.string().optional(),
  faculty: z.string().optional(),
});

/** GET /admin/judge-whitelist - danh sách whitelist BGK (chỉ Admin) */
const getJudgeWhitelist = async (req, res) => {
  const { page, limit, keyword, faculty } = req.query;
  const data = await judgeWhitelistService.getJudgeWhitelist({ page, limit, keyword, faculty });
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách whitelist Ban Giám khảo thành công.',
    data,
  });
};

/** POST /admin/judge-whitelist/import - import Excel whitelist BGK (chỉ Admin) */
const importJudgeWhitelistExcel = async (req, res) => {
  if (!req.file) {
    throw new (require('../utils/apiError').default || require('../utils/apiError'))(400, 'Thiếu file Excel', 'MISSING_EXCEL_FILE');
  }

  const XLSX = require('xlsx');
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const result = await judgeWhitelistService.importJudgeWhitelistFromRows(rows, req.user.id);

  res.status(201).json({
    success: true,
    message: `Import thành công ${result.imported} bản ghi${result.skipped ? `, bỏ qua ${result.skipped}` : ''}.`,
    data: result,
  });
};

/** DELETE /admin/judge-whitelist/:id - xóa bản ghi whitelist (chỉ Admin) */
const removeJudgeWhitelist = async (req, res) => {
  await judgeWhitelistService.removeJudgeWhitelist(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Đã xoá bản ghi whitelist Ban Giám khảo.',
  });
};

module.exports = {
  getJudgeWhitelist,
  importJudgeWhitelistExcel,
  removeJudgeWhitelist,
  judgeWhitelistIdParamsSchema,
  getJudgeWhitelistQuerySchema,
};
