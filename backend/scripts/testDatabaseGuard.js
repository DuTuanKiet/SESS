const Module = require('node:module');

const TARGETS = Object.freeze({
  integration: {
    variable: 'SESS_INTEGRATION_MONGO_URI',
    databaseName: 'sess_integration_test',
  },
  e2e: {
    variable: 'SESS_STUDENT_E2E_MONGO_URI',
    databaseName: 'sess_student_e2e_test',
  },
});

/** Chặn dotenv; seed/test chỉ nhận cấu hình được truyền rõ từ môi trường tiến trình. */
const blockDotenvConfig = () => {
  const originalLoad = Module._load;
  Module._load = function loadWithoutDotenv(request, ...loadArgs) {
    if (request === 'dotenv/config') return {};
    if (request === 'dotenv') {
      return {
        config: () => ({ parsed: {} }),
        parse: () => ({}),
      };
    }
    return originalLoad.call(this, request, ...loadArgs);
  };
};

/** Chỉ trả URI nếu database đích trùng chính xác với database test đã định danh. */
const getTestMongoUri = (target = 'integration', environment = process.env) => {
  const config = TARGETS[target];
  if (!config) throw new Error('Target phải là integration hoặc e2e.');

  const mongoUri = environment[config.variable];
  if (!mongoUri) throw new Error(`Thiếu ${config.variable}; không đọc URI từ file môi trường.`);

  let databaseName = '';
  try {
    const parsedUri = new URL(mongoUri);
    if (!['mongodb:', 'mongodb+srv:'].includes(parsedUri.protocol)) throw new Error('invalid protocol');
    databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\/+/, '').split('/')[0] || '');
  } catch {
    throw new Error(`${config.variable} không phải MongoDB URI hợp lệ.`);
  }

  if (databaseName !== config.databaseName) {
    throw new Error(
      `Từ chối chạy: ${config.variable} phải trỏ chính xác tới database ${config.databaseName}.`,
    );
  }

  return mongoUri;
};

const assertTestDatabaseName = (actualDatabaseName, target = 'integration') => {
  const config = TARGETS[target];
  if (!config || actualDatabaseName !== config.databaseName) {
    const expected = config?.databaseName || 'database test hợp lệ';
    throw new Error(`Từ chối cleanup: database kết nối không phải ${expected}.`);
  }
};

module.exports = { blockDotenvConfig, getTestMongoUri, assertTestDatabaseName };
