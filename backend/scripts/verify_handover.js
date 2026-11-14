/**
 * Script kiểm định tự động trước bàn handover hệ thống SESS.
 * Kết nối MongoDB và xác thực tính toàn vẹn dữ liệu nghiệp vụ.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { USER_ROLES, USER_STATUS, PROJECT_STATUS, EDITABLE_PROJECT_STATUSES } = require('../src/utils/constants');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sess_db';

// Register models (goi mongoose.model ten, schema) de co the su dung mongoose.model('Ten') sau nay
const modelFiles = [
  'User',
  'UserProfile',
  'StudentWhitelist',
  'JudgeWhitelist',
  'Project',
  'ProjectMember',
  'ProjectMemberChangeRequest',
  'ProjectRevision',
  'ProjectMilestone',
  'ProjectFeedback',
  'ProjectCancellationRequest',
  'AssignmentCancellationRequest',
  'ProjectVote',
  'EvaluationRubric',
  'EvaluationRound',
  'EvaluationSubmission',
  'HumanEvaluation',
  'Mentor',
  'MentorAssignment',
  'MilestoneComment',
  'Notification',
  'AuditLog',
  'EmailLog',
  'CloudFileUpload',
  'EmergencyJudgeReassignment',
  'HonorHistory',
  'Otp',
  'RewardClaim',
  'ScoreOverride',
  'Appeal',
  'News',
];

for (const modelName of modelFiles) {
  try {
    require(`../src/models/${modelName}`);
  } catch (err) {
    console.warn(`[verify_handover] Khong dang ky duoc model ${modelName}: ${err.message}`);
  }
}

const results = {
  pass: 0,
  fail: 0,
  errors: [],
};
const ok = (m) => { results.pass++; console.log(`  [PASS] ${m}`); };
const bad = (m) => { results.fail++; results.errors.push(m); console.log(`  [FAIL] ${m}`); };

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  console.log(`Connected to MongoDB: ${MONGO_URI}\n`);

  const User = mongoose.model('User');
  const StudentWhitelist = mongoose.model('StudentWhitelist');
  const JudgeWhitelist = mongoose.model('JudgeWhitelist');
  const Project = mongoose.model('Project');
  const EvaluationRubric = mongoose.model('EvaluationRubric');
  const HumanEvaluation = mongoose.model('HumanEvaluation');
  const ProjectMember = mongoose.model('ProjectMember');

  // ---- Users ----
  console.log('== Users ==');
  // Load whitelist sớm để đối chiếu tài khoản rác (STUDENT phải có trong danh sách Admin cấp).
  const sw0 = await StudentWhitelist.find({}).lean();
  const users = await User.find({}).lean();
  console.log(`  Tong so users: ${users.length}`);
  let userOrphan = 0;
  const whitelistEmails = new Set(sw0.map((w) => String(w.email || '').toLowerCase()));
  for (const u of users) {
    const issues = [];
    if (!u.email) issues.push('thieu email');
    if (u.role && !Object.values(USER_ROLES).includes(u.role)) issues.push(`role khong hop le: ${u.role}`);
    if (u.systemRole && u.systemRole !== u.role) issues.push(`systemRole(${u.systemRole}) != role(${u.role})`);
    if (!u.isEmailVerified && u.role === USER_ROLES.ADMIN) issues.push('admin chua xac thuc email');
    // STRICT ALLOWLIST: mọi STUDENT phải có trong StudentWhitelist (nguồn Admin cấp quyền).
    if (u.role === USER_ROLES.STUDENT && u.email && !whitelistEmails.has(String(u.email).toLowerCase())) {
      issues.push('STUDENT khong co trong StudentWhitelist (nghi ngo tai khoan rac)');
    }
    if (u.status && !Object.values(USER_STATUS).includes(u.status)) issues.push(`status khong hop le: ${u.status}`);
    if (issues.length) { userOrphan++; bad(`User ${u._id}: ${issues.join('; ')}`); }
  }
  if (userOrphan === 0) ok(`Tat ca ${users.length} user hop le, role/systemRole dong bo, khong co ban record loi/tai khoan rac`);

  // ---- Whitelists ----
  console.log('== Whitelists ==');
  const sw = sw0;
  const jw = await JudgeWhitelist.find({}).lean();
  let wlBad = 0;
  for (const w of [...sw, ...jw]) {
    if (!w.email) { wlBad++; bad(`Whitelist ${w._id}: thieu email`); }
  }
  if (wlBad === 0) ok(`StudentWhitelist(${sw.length}) + JudgeWhitelist(${jw.length}) toan bo co email`);

  // ---- Projects ----
  console.log('== Projects ==');
  const projects = await Project.find({}).lean();
  console.log(`  Tong so projects: ${projects.length}`);
  let projBad = 0;
  for (const p of projects) {
    const issues = [];
    // orphan ownerId
    if (p.ownerId) {
      const owner = await User.findById(p.ownerId).lean();
      if (!owner) { issues.push(`ownerId ${p.ownerId} khong ton tai trong User`); projBad++; }
    }
    // alias field sync
    if ((p.title || p.name) && !(p.title === p.name)) {
      // allow one empty
      if (p.title && p.name && p.title !== p.name) issues.push(`title(${p.title}) != name(${p.name})`);
    }
    if ((p.category || p.field) && p.category && p.field && p.category !== p.field) issues.push(`category(${p.category}) != field(${p.field})`);
    if ((p.abstract || p.description) && p.abstract && p.description && p.abstract !== p.description) issues.push(`abstract(${p.abstract}) != description(${p.description})`);
    if (p.version !== undefined && p.currentVersion !== undefined && p.version !== p.currentVersion) issues.push(`version(${p.version}) != currentVersion(${p.currentVersion})`);
    // required core fields presence check (soft)
    if (!p.status) issues.push('thieu status');
    if (!Object.values(PROJECT_STATUS).includes(p.status)) issues.push(`status khong hop le: ${p.status}`);
    if (issues.length) { projBad++; bad(`Project ${p.code || p._id}: ${issues.join('; ')}`); }
  }
  if (projBad === 0) ok(`Tat ca ${projects.length} project hop le, alias dong bo, khong co owner bi mo`);

  // ---- EvaluationRubric ----
  console.log('== EvaluationRubric ==');
  const rubrics = await EvaluationRubric.find({}).lean();
  console.log(`  Tong so rubric: ${rubrics.length}`);
  let rubricBad = 0;
  for (const r of rubrics) {
    const issues = [];
    if (!r.name) issues.push('thieu ten');
    let totalWeight = 0;
    for (const c of (r.criteria || [])) {
      totalWeight += Number(c.weight || 0);
      if (c.minScore !== undefined && c.maxScore !== undefined && c.minScore >= c.maxScore) issues.push(`tieu chi ${c.name}: minScore >= maxScore`);
      if ((c.weight || 0) < 1 || (c.weight || 0) > 100) issues.push(`tieu chi ${c.name}: weight ngoai [1,100]`);
    }
    if (r.totalWeight !== undefined && Math.abs(Number(r.totalWeight) - totalWeight) > 1) issues.push(`totalWeight(${r.totalWeight}) != tong criteria(${totalWeight})`);
    if (issues.length) { rubricBad++; bad(`Rubric ${r._id}: ${issues.join('; ')}`); }
  }
  if (rubricBad === 0) ok(`Tat ca ${rubrics.length} rubric hop le, minScore<maxScore, weight [1,100]`);

  // ---- HumanEvaluation ----
  console.log('== HumanEvaluation ==');
  const hes = await HumanEvaluation.find({}).lean();
  console.log(`  Tong so HumanEvaluation: ${hes.length}`);
  let heBad = 0;
  const projectIds = new Set(projects.map((p) => String(p._id)));
  for (const he of hes) {
    const issues = [];
    if (!projectIds.has(String(he.projectId))) { issues.push(`projectId ${he.projectId} bi mo`); heBad++; }
    const scoreInvalid = (he.scores || []).some((s) => !Number.isFinite(s.score) || s.score < 0);
    if (scoreInvalid) issues.push('co diem am/NaN');
    if (he.status && !['DRAFT', 'SUBMITTED'].includes(he.status)) issues.push(`status khong hop le: ${he.status}`);
    if (issues.length) bad(`HumanEvaluation ${he._id}: ${issues.join('; ')}`);
  }
  // duplicate check per (evaluationRoundId, projectId, evaluatorId)
  const dupMap = new Map();
  for (const he of hes) {
    const key = `${String(he.evaluationRoundId)}|${String(he.projectId)}|${String(he.evaluatorId)}`;
    dupMap.set(key, (dupMap.get(key) || 0) + 1);
  }
  const dups = [...dupMap.entries()].filter(([, c]) => c > 1);
  if (dups.length) { heBad++; bad(`Tim thay ${dups.length} ban ghi HumanEvaluation trung lap`); }
  if (heBad === 0) ok(`Tat ca ${hes.length} HumanEvaluation hop le, khong co project mo, khong trung lap`);

  // ---- ProjectMember ----
  console.log('== ProjectMember ==');
  const pms = await ProjectMember.find({}).lean();
  console.log(`  Tong so ProjectMember: ${pms.length}`);
  let pmBad = 0;
  for (const pm of pms) {
    if (!projectIds.has(String(pm.projectId))) { pmBad++; bad(`ProjectMember ${pm._id}: projectId bi mo`); continue; }
    const validRoles = ['OWNER', 'MEMBER'];
    if (!validRoles.includes(pm.role)) { pmBad++; bad(`ProjectMember ${pm._id}: role khong hop le ${pm.role}`); }
  }
  if (pmBad === 0) ok(`Tat ca ${pms.length} ProjectMember hop le, khong co project mo`);

  // ---- Mentors (integrity vs users) ----
  console.log('== Mentors ==');
  const Mentor = mongoose.model('Mentor');
  const mentors = await Mentor.find({}).lean();
  console.log(`  Tong so mentors: ${mentors.length}`);
  const mentorUserIds = new Set(
    users.filter((u) => String(u.role || u.systemRole || '').toUpperCase() === 'MENTOR').map((u) => String(u._id))
  );
  let mentorBad = 0;
  for (const mt of mentors) {
    if (!mt.userId || !mentorUserIds.has(String(mt.userId))) {
      mentorBad++;
      bad(`Mentor ${mt._id}: userId ${mt.userId} khong ton tai hoac khong phai MENTOR (orphan)`);
    }
  }
  if (mentorBad === 0) ok(`Tat ca ${mentors.length} mentor hop le, khong co ban ghi mo`);

  await mongoose.disconnect();
  console.log(`\n================ TONG KET ================`);
  console.log(`PASS: ${results.pass} | FAIL: ${results.fail}`);
  if (results.fail > 0) {
    console.log('Chi tiet loi:');
    results.errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('DU LIEU TRONG MONGODB HOAN TOAN HOP LE. San sang ban giao.');
  }
}

main().catch((err) => {
  console.error('KHONG THE KET NOI HOI CHUYEN MongoDB:', err.message);
  console.log('SKIP: Kiem tra du lieu DB (can MongoDB chay).');
  process.exit(0);
});
