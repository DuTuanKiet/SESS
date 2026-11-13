/* eslint-disable no-console */
/**
 * final_deep_audit.js - Final Zero-Defect Audit cho toan bo he thong SESS.
 *
 * Cac tang kiem soat:
 *   TANG 1: Cross-layer call integrity (Routes -> Controllers -> Services -> FE services)
 *   TANG 2: Enum / status / role consistency (constants <-> models <-> validations <-> FE)
 *   TANG 3: Edge cases (chia cho 0, du lieu rong) + an diem nhap so voi sinh vien
 *   TANG 4: Notifications schema <-> service khop nhau
 *
 * Cach hoat dong: DOC file (khong require) de tranh side-effect (DB/Redis). Dung regex
 * de trich xuat export key va loi goi ham, sau do doi chieu.
 *
 * Thoat voi exit code != 0 neu phat hien loi.
 */
const fs = require('fs');
const path = require('path');

const BACKEND_SRC = path.resolve(__dirname, '../src');
const FRONTEND_SRC = path.resolve(__dirname, '../../frontend/src');

const results = { pass: 0, fail: 0, errors: [], warnings: [] };
const ok = (m) => {
  results.pass += 1;
  console.log(`  [PASS] ${m}`);
};
const bad = (m) => {
  results.fail += 1;
  results.errors.push(m);
  console.log(`  [FAIL] ${m}`);
};
const warn = (m) => {
  results.warnings.push(m);
  console.log(`  [WARN] ${m}`);
};

const read = (p) => {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
};

const listFiles = (dir, ext) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, f));
};

/**
 * Tach ten key tu than mot object literal `{ a, b, c: ..., "d-e": ... }`.
 * Chi tra ve ten bien don thuan (identifier), bo qua key dang string.
 */
const parseObjectKeys = (body) => {
  const names = new Set();
  const text = String(body).trim();
  const re = /(?:^|[,{\n])\s*([A-Za-z_$][\w$]*)\s*(?=[:,}\n]|$)/g;
  let m;
  while ((m = re.exec(text))) names.add(m[1]);
  return names;
};

/**
 * Trich cac ten key export tu mot file CommonJS hoac ES module.
 * Ho tro:
 *   module.exports = { a, b, c };
 *   module.exports = { a, b, c: ... };
 *   exports.a = ...; exports.b = ...;
 *   export const a = ...; export function b() {} ; export default { ... }
 */
const extractExports = (source) => {
  const names = new Set();

  // module.exports = { ... } (non-greedy, dung dau '}' dau tien)
  const meMatch = source.match(/module\.exports\s*=\s*\{([\s\S]*?)\};?/);
  if (meMatch) {
    for (const k of parseObjectKeys(meMatch[1])) names.add(k);
  }

  // exports.foo = ...
  const exRe = /exports\.([A-Za-z_$][\w$]*)\s*=/g;
  let m;
  while ((m = exRe.exec(source))) names.add(m[1]);

  // export const foo / export function foo / export async function foo
  const esmRe = /export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = esmRe.exec(source))) names.add(m[1]);

  // export default { a, b }
  const defMatch = source.match(/export\s+default\s*\{([\s\S]*?)\};?/);
  if (defMatch) {
    for (const k of parseObjectKeys(defMatch[1])) names.add(k);
  }

  return names;
};

/**
 * Lay danh sach require alias -> duong dan service tu mot file.
 * Vi du: const fooService = require('../services/fooService') => { fooService: '../services/fooService' }
 */
const extractServiceRequires = (source) => {
  const map = {};
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(\s*['"]([^'"]*services\/[^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(source))) {
    map[m[1]] = m[2];
  }
  return map;
};

const section = (title) => console.log(`\n=== ${title} ===`);

const collectCalls = (src, alias, fileLabel, exportedKeys, sink) => {
  const re = new RegExp(`\\b${alias}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g');
  let m;
  const seen = new Set();
  while ((m = re.exec(src))) {
    const method = m[1];
    if (seen.has(method)) continue;
    seen.add(method);
    if (exportedKeys && !exportedKeys.has(method)) {
      sink.push(`${fileLabel}: goi ${alias}.${method}() nhung service khong export '${method}'`);
    }
  }
};

// ---------------------------------------------------------------------------
// TANG 1: Cross-layer call integrity
// ---------------------------------------------------------------------------
const auditCrossLayer = () => {
  section('TANG 1: Cross-layer call integrity (Routes -> Controllers -> Services -> FE)');

  const serviceFiles = listFiles(path.join(BACKEND_SRC, 'services'), '.js');
  const controllerFiles = listFiles(path.join(BACKEND_SRC, 'controllers'), '.js');

  const serviceExportMap = new Map(); // absolutePath -> Set(keys)
  for (const sf of serviceFiles) {
    const src = read(sf);
    if (src == null) continue;
    serviceExportMap.set(sf, extractExports(src));
  }

  const resolveService = (fromFile, relPath) => {
    const absPath = path.resolve(path.dirname(fromFile), relPath);
    const candidates = [absPath, `${absPath}.js`, path.join(absPath, 'index.js')];
    for (const c of candidates) {
      if (serviceExportMap.has(c)) return serviceExportMap.get(c);
    }
    // fallback theo ten file
    const base = path.basename(relPath).replace(/\.js$/, '');
    const byName = serviceFiles.find((s) => path.basename(s, '.js') === base);
    return byName ? serviceExportMap.get(byName) : null;
  };

  // 1a. Controllers -> Services
  let controllerChecks = 0;
  const missingCalls = [];
  for (const cf of controllerFiles) {
    const src = read(cf);
    if (src == null) continue;
    const requires = extractServiceRequires(src);
    for (const alias of Object.keys(requires)) {
      const keys = resolveService(cf, requires[alias]);
      if (!keys) continue;
      collectCalls(src, alias, path.basename(cf), keys, missingCalls);
      controllerChecks += 1;
    }
  }
  if (missingCalls.length) {
    for (const miss of missingCalls) bad(miss);
  } else {
    ok(`Da doi chieu ${controllerChecks} cap controller->service, khong co loi goi ham thieu.`);
  }

  // 1b. Services -> Services
  const serviceMissing = [];
  for (const sf of serviceFiles) {
    const src = read(sf);
    if (src == null) continue;
    const requires = extractServiceRequires(src);
    for (const alias of Object.keys(requires)) {
      const keys = resolveService(sf, requires[alias]);
      if (!keys) continue;
      collectCalls(src, alias, path.basename(sf), keys, serviceMissing);
    }
  }
  if (serviceMissing.length) {
    for (const miss of serviceMissing) bad(miss);
  } else {
    ok('Da doi chieu service->service, khong co loi goi ham thieu.');
  }

  // 1c. Routes: khong co handler undefined
  const routeFiles = listFiles(path.join(BACKEND_SRC, 'routes'), '.js');
  const routeIssues = [];
  for (const rf of routeFiles) {
    const src = read(rf);
    if (src == null) continue;
    const verbRe = /router\.(get|post|put|patch|delete)\(\s*['"`][^'"`]*['"`]\s*,([\s\S]*?)\);/g;
    let vm;
    while ((vm = verbRe.exec(src))) {
      const parts = vm[2].split(',').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (/\bundefined\b/.test(part)) {
          routeIssues.push(`${path.basename(rf)}: handler 'undefined' trong route ${vm[1].toUpperCase()}`);
        }
      }
    }
  }
  if (routeIssues.length) {
    for (const issue of routeIssues) bad(issue);
  } else {
    ok(`Da quet ${routeFiles.length} route file, khong co handler undefined.`);
  }

  auditFrontendExports();
};

const auditFrontendExports = () => {
  const feServiceDirs = [
    path.join(FRONTEND_SRC, 'services'),
    path.join(FRONTEND_SRC, 'stores'),
    path.join(FRONTEND_SRC, 'modules', 'administration', 'services'),
    path.join(FRONTEND_SRC, 'modules', 'mentoring', 'common', 'services'),
    path.join(FRONTEND_SRC, 'modules', 'competitions', 'services'),
  ];

  const feModules = new Map(); // basename -> Set(keys)
  for (const dir of feServiceDirs) {
    for (const f of listFiles(dir, '.js')) {
      const src = read(f);
      if (src == null) continue;
      feModules.set(path.basename(f, '.js'), extractExports(src));
    }
  }
  if (!feModules.size) {
    warn('Khong tim thay FE service/store nao de doi chieu.');
    return;
  }

  const allFeFiles = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(vue|js)$/.test(entry)) allFeFiles.push(full);
    }
  };
  walk(FRONTEND_SRC);

  // Chi bat import tu '@/services/<name>' hoac '@/stores/<name>' (khong vuot qua dau ngoac)
  const importRe =
    /import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\})?\s*from\s*['"]@(?:\/services\/|\/stores\/)([\w-]+)['"]/g;
  let checked = 0;
  const missing = [];

  for (const file of allFeFiles) {
    const src = read(file);
    if (src == null) continue;
    let m;
    importRe.lastIndex = 0;
    while ((m = importRe.exec(src))) {
      const named = m[2];
      const modName = m[3];
      const keys = feModules.get(modName);
      if (!keys || !named) continue;
      const names = named
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      if (!names.length) continue;
      checked += 1;
      for (const name of names) {
        if (!keys.has(name)) {
          missing.push(`${path.basename(file)}: import '${name}' tu ${modName}.js nhung khong co export nay`);
        }
      }
    }
  }

  if (missing.length) {
    for (const mi of missing) bad(mi);
  } else {
    ok(`Da doi chieu ${checked} lenh import FE, khong co ham/thieu export.`);
  }
};

// ---------------------------------------------------------------------------
// TANG 2: Enum / status / role consistency
// ---------------------------------------------------------------------------
const auditEnums = () => {
  section('TANG 2: Enum / status / role consistency');

  const constantsSrc = read(path.join(BACKEND_SRC, 'utils', 'constants.js'));
  if (!constantsSrc) {
    bad('Khong doc duoc utils/constants.js');
    return;
  }

  const getEnumValues = (src, varName) => {
    const re = new RegExp(`${varName}\\s*=\\s*Object\\.freeze\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`);
    const m = src.match(re);
    if (!m) return null;
    const vals = new Set();
    const vRe = /:\s*['"]([^'"]+)['"]/g;
    let vm;
    while ((vm = vRe.exec(m[1]))) vals.add(vm[1]);
    return vals;
  };

  const projectStatus = getEnumValues(constantsSrc, 'PROJECT_STATUS');
  const memberStatus = getEnumValues(constantsSrc, 'PROJECT_MEMBER_STATUS');
  const roles = getEnumValues(constantsSrc, 'USER_ROLES');

  const humanEvalPath = path.join(BACKEND_SRC, 'models', 'HumanEvaluation.js');
  const heSrc = read(humanEvalPath);
  if (heSrc) {
    const statusMatch = heSrc.match(/status:\s*\{[^}]*enum:\s*\[([^\]]*)\]/);
    if (statusMatch) {
      const vals = new Set(
        statusMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean),
      );
      const missing = ['DRAFT', 'SUBMITTED'].filter((v) => !vals.has(v));
      if (missing.length) bad(`HumanEvaluation.status thieu: ${missing.join(',')}`);
      else ok('HumanEvaluation.status enum chua du DRAFT/SUBMITTED.');
    }
  }

  const evalValPath = path.join(BACKEND_SRC, 'validations', 'evaluatorValidation.js');
  const evalVal = read(evalValPath);
  if (evalVal) {
    const enumMatch = evalVal.match(/z\.enum\(\s*\[([^\]]*)\]/);
    if (enumMatch) {
      const vals = new Set(
        enumMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean),
      );
      const missing = ['DRAFT', 'SUBMIT'].filter((v) => !vals.has(v));
      if (missing.length) bad(`evaluatorValidation actionType thieu: ${missing.join(',')}`);
      else ok('evaluatorValidation actionType enum khop DRAFT/SUBMIT.');
    }
  }

  if (projectStatus && projectStatus.size) ok(`PROJECT_STATUS co ${projectStatus.size} gia tri.`);
  if (memberStatus && memberStatus.size) ok(`PROJECT_MEMBER_STATUS co ${memberStatus.size} gia tri.`);
  if (roles && roles.size) ok(`USER_ROLES co ${roles.size} gia tri.`);
};

// ---------------------------------------------------------------------------
// TANG 3: Edge cases (chia cho 0, du lieu rong) + an diem nhap
// ---------------------------------------------------------------------------
const auditEdgeCases = () => {
  section('TANG 3: Edge cases + an diem nhap');

  const backendSrc = read(path.join(BACKEND_SRC, 'services', 'evaluatorService.js'));
  if (backendSrc) {
    if (
      /submitted\.length\s*\?/.test(backendSrc) ||
      /submitted\.length\s*&&/.test(backendSrc) ||
      /averageScore[\s\S]{0,80}submitted\.length/.test(backendSrc)
    ) {
      ok('evaluatorService.getEvaluationSummary co guard submitted.length truoc khi chia.');
    } else {
      bad('evaluatorService: nghi ngo chia cho 0 khi tinh averageScore (khong thay guard submitted.length).');
    }
  }

  const feChecks = [
    ['modules/judging/pages/JudgeDashboardView.vue', /!\s*totalAssigned\.value|totalAssigned\.value\)\s*return\s*0/],
    ['modules/judging/pages/JudgeHistoryView.vue', /!\s*filteredHistory\.value\.length/],
    ['views/EvaluatorWorkspaceView.vue', /averageScore\s*!=\s*null|submittedCount\s*!=\s*null/],
  ];
  for (const [rel, re] of feChecks) {
    const src = read(path.join(FRONTEND_SRC, rel));
    if (!src) continue;
    if (re.test(src)) ok(`${rel}: co guard chia cho 0 / du lieu rong.`);
    else warn(`${rel}: chua thay guard chia cho 0 ro rang.`);
  }

  const studentDetail = read(path.join(FRONTEND_SRC, 'modules', 'student', 'pages', 'StudentProjectDetailPage.vue'));
  if (studentDetail) {
    if (/needsAdminReview|adminReviewReason/.test(studentDetail)) {
      warn('StudentProjectDetailPage co tham chieu needsAdminReview/adminReviewReason - can xac nhan khong lo noi bo.');
    } else {
      ok('StudentProjectDetailPage khong tiet lo needsAdminReview/adminReviewReason.');
    }
  }
};

// ---------------------------------------------------------------------------
// TANG 4: Notifications schema <-> service
// ---------------------------------------------------------------------------
const auditNotifications = () => {
  section('TANG 4: Notifications schema <-> service khop');

  const modelSrc = read(path.join(BACKEND_SRC, 'models', 'Notification.js'));
  const svcSrc = read(path.join(BACKEND_SRC, 'services', 'notificationService.js'));
  if (!modelSrc || !svcSrc) {
    warn('Khong doc duoc Notification model hoac service de doi chieu.');
    return;
  }

  const modelHas = (field) =>
    new RegExp(`(^|[\\s{,])${field}:\\s*\\{`).test(modelSrc) ||
    new RegExp(`(^|[\\s{,])${field}:\\s*(?:mongoose|\\[)`).test(modelSrc);

  // Lay than block $setOnInsert (noi duy nhất duoc ghi vao DB)
  const setOnInsertMatch = svcSrc.match(/\$setOnInsert:\s*\{([\s\S]*?)\}\s*,?\s*\}/);
  const writeBody = setOnInsertMatch ? setOnInsertMatch[1] : '';
  const writeKeys = new Set();
  const keyRe = /(?:^|[,{\n])\s*([A-Za-z_$][\w$]*)\s*:/g;
  let km;
  while ((km = keyRe.exec(writeBody))) writeKeys.add(km[1]);

  const problems = [];
  if (setOnInsertMatch) {
    if (!writeKeys.size) problems.push('khong trich xuat duoc key nao trong $setOnInsert');
    for (const k of writeKeys) {
      if (!modelHas(k)) problems.push(`$setOnInsert ghi field '${k}' khong co trong model Notification`);
    }
  } else {
    problems.push('khong tim thay $setOnInsert trong createForRecipients');
  }

  // type enum check: chi xet gia tri type o cap $setOnInsert (da duoc normalize)
  const typeEnumMatch = modelSrc.match(/type:\s*\{[\s\S]*?enum:\s*\[([^\]]*)\]/);
  const allowedTypes = typeEnumMatch
    ? new Set(
        typeEnumMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/['"]/g, ''))
          .filter(Boolean),
      )
    : null;

  if (allowedTypes && setOnInsertMatch) {
    // Neu $setOnInsert dung biến da normalize (type: normalizedType) => OK.
    // Neu ghi truc tiep chuoi literal thi chuoi do phai nam trong enum.
    const typeLineMatch = setOnInsertMatch[1].match(/type:\s*([^,\n}]+)/);
    if (typeLineMatch) {
      const rawVal = typeLineMatch[1].trim();
      const literal = rawVal.match(/^['"]([^'"]+)['"]$/);
      if (literal && !allowedTypes.has(literal[1])) {
        problems.push(`type ghi truc tiep '${literal[1]}' ngoai enum`);
      }
      // Neu la bien (vd normalizedType) thi coi hop le vi da qua normalizeNotificationType.
    }
  }

  // normalizeNotificationType phai ton tai va map ve gia tri hop le
  if (/const\s+normalizeNotificationType|function\s+normalizeNotificationType/.test(svcSrc)) {
    ok('notificationService co ham normalizeNotificationType.');
  } else {
    problems.push('thieu ham normalizeNotificationType');
  }

  if (/\bcontent:\s*message\b/.test(svcSrc) || /content:/.test(svcSrc)) {
    if (!/\bmessage:/.test(writeBody)) ok('notificationService map message -> content (khong ghi truc tiep message).');
    else problems.push('vẫn ghi field message vào DB');
  }
  if (/\blink:\s*actionUrl\b/.test(svcSrc)) ok('notificationService map actionUrl -> link.');
  else problems.push('khong thay map actionUrl -> link');

  if (/recipientRole/.test(writeBody)) ok('notificationService set recipientRole trong $setOnInsert.');
  else problems.push('thieu recipientRole trong $setOnInsert');

  if (problems.length) {
    for (const p of problems) bad(`Notification: ${p}`);
  } else {
    ok('Notification service khop hoan toan voi model (content/link/type/recipientRole).');
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
main();
function main() {
  console.log('================ FINAL DEEP AUDIT (SESS) ================');
  auditCrossLayer();
  auditEnums();
  auditEdgeCases();
  auditNotifications();

  console.log('\n================ TONG KET ================');
  console.log(`PASS: ${results.pass} | FAIL: ${results.fail} | WARN: ${results.warnings.length}`);
  if (results.warnings.length) {
    console.log('Canh bao:');
    for (const w of results.warnings) console.log(`  - ${w}`);
  }
  if (results.fail > 0) {
    console.log('Chi tiet loi:');
    for (const e of results.errors) console.log(`  - ${e}`);
    process.exit(1);
  } else {
    console.log('TAT CA CAC TANG KIEM SOAT DEU PASS. Khong con loi nghiem trong.');
    process.exit(0);
  }
}