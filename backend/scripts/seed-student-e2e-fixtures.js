/** Chuẩn bị fixture nghiệp vụ của luồng sinh viên trong database E2E riêng. */
const { blockDotenvConfig, getTestMongoUri } = require('./testDatabaseGuard');
blockDotenvConfig();

const targetArg = process.argv.slice(2).find((argument) => argument.startsWith('--target='));
const target = targetArg ? targetArg.slice('--target='.length) : 'e2e';
const mongoUri = getTestMongoUri(target);
if (target !== 'e2e') throw new Error('Fixture sinh viên chỉ được tạo trong database E2E riêng.');
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongoUri;

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const ProjectMember = require('../src/models/ProjectMember');
const ProjectMilestone = require('../src/models/ProjectMilestone');
const Mentor = require('../src/models/Mentor');
const MentorAssignment = require('../src/models/MentorAssignment');
const JudgeWhitelist = require('../src/models/JudgeWhitelist');
const {
  ASSIGNMENT_STATUS,
  MILESTONE_STATUS,
  PROJECT_LEVEL,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  PROJECT_STATUS,
} = require('../src/utils/constants');

const userByEmail = async (email) => {
  const user = await User.findOne({ email }).select('_id email fullName role').lean();
  if (!user) {
    throw new Error(
      `Thiếu tài khoản fixture ${email}; hãy chạy npm run seed -- --target=e2e trước.`,
    );
  }
  return user;
};

const upsertProject = async ({
  code,
  title,
  owner,
  status,
  level,
  parentId = null,
  members = [],
  ...fields
}) =>
  Project.findOneAndUpdate(
    { code },
    {
      $set: {
        title,
        name: title,
        code,
        category: 'E2E fixture',
        field: 'E2E fixture',
        abstract: 'Dữ liệu mẫu dùng cho kiểm thử luồng sinh viên.',
        description: 'Dữ liệu mẫu dùng cho kiểm thử luồng sinh viên.',
        ownerId: owner._id,
        status,
        level,
        parentId,
        isLinked: Boolean(parentId),
        members: [
          { userId: owner._id, projectRole: 'Owner' },
          ...members.map((user) => ({ userId: user._id, projectRole: 'Member' })),
        ],
        ...fields,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

const upsertAcceptedMember = async ({ project, user, role }) => {
  await ProjectMember.updateOne(
    { projectId: project._id, userId: user._id },
    {
      $set: {
        email: user.email,
        role,
        status: PROJECT_MEMBER_STATUS.ACCEPTED,
        joinedAt: new Date(),
      },
      $setOnInsert: { invitedBy: null },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
};

const upsertMilestone = async ({ project, mentor, title, startDate, dueDate, evidence }) =>
  ProjectMilestone.updateOne(
    { projectId: project._id, title },
    {
      $set: {
        createdBy: mentor._id,
        description: `Fixture kiểm thử: ${title}.`,
        startDate,
        dueDate,
        status: evidence ? MILESTONE_STATUS.COMPLETED : MILESTONE_STATUS.PENDING,
        evidence: evidence || {
          submittedBy: null,
          url: null,
          fileName: '',
          note: '',
          submittedAt: null,
          isLate: false,
        },
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

const seedStudentE2eFixtures = async () => {
  await mongoose.connect(mongoUri);

  const [admin, student1, student2, student3, mentorUser, judge] = await Promise.all([
    userByEmail(process.env.ADMIN_EMAIL || 'admin@ctuet.edu.vn'),
    userByEmail('110122001@student.ctuet.edu.vn'),
    userByEmail('110122002@student.ctuet.edu.vn'),
    userByEmail('110122003@student.ctuet.edu.vn'),
    userByEmail('mentor01@ctuet.edu.vn'),
    userByEmail('judge01@ctuet.edu.vn'),
  ]);

  await Mentor.updateOne(
    { userId: mentorUser._id },
    {
      $setOnInsert: {
        userId: mentorUser._id,
        email: mentorUser.email,
        fullName: mentorUser.fullName,
        fields: ['E2E fixture'],
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await JudgeWhitelist.updateOne(
    { email: judge.email },
    {
      $setOnInsert: {
        fullName: judge.fullName || 'E2E Judge',
        staffCode: 'E2E-JUDGE-001',
        email: judge.email,
        faculty: 'E2E fixture',
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const now = new Date();
  const rootDraft = await upsertProject({
    code: 'SESS-E2E-ROOT-DRAFT',
    title: 'E2E đề tài gốc đang mở',
    owner: student1,
    members: [student2],
    status: PROJECT_STATUS.DRAFT,
    level: PROJECT_LEVEL.FACULTY,
    currentRound: 1,
    submissionRounds: [{
      roundId: 'e2e-open-round-1',
      roundNumber: 1,
      title: 'Vòng đang mở',
      status: 'OPEN',
      opensAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    }],
  });
  const rootNoRound = await upsertProject({
    code: 'SESS-E2E-ROOT-NO-ROUND',
    title: 'E2E đề tài không có vòng nộp',
    owner: student1,
    members: [student3],
    status: PROJECT_STATUS.NEED_REVISION,
    level: PROJECT_LEVEL.FACULTY,
    currentRound: 1,
    judges: [],
    submissionRounds: [],
  });
  const mentorshipProject = await upsertProject({
    code: 'SESS-E2E-MENTORSHIP',
    title: 'E2E đề tài đang cố vấn',
    owner: student2,
    members: [student3],
    status: PROJECT_STATUS.UNDER_MENTORSHIP,
    level: PROJECT_LEVEL.FACULTY,
  });
  const childProject = await upsertProject({
    code: 'SESS-E2E-CHILD-UNIVERSITY',
    title: 'E2E đề tài thi vượt cấp',
    owner: student1,
    members: [student2],
    status: PROJECT_STATUS.DRAFT,
    level: PROJECT_LEVEL.UNIVERSITY,
    parentId: rootDraft._id,
    currentRound: 2,
    submissionRounds: [{
      roundId: 'e2e-closed-round-1',
      roundNumber: 1,
      title: 'Vòng đã đóng',
      status: 'CLOSED',
      opensAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      closesAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    }],
  });
  const awardedProject = await upsertProject({
    code: 'SESS-E2E-COMPLETED-AWARDED',
    title: 'E2E đề tài hoàn tất có giải',
    owner: student1,
    status: PROJECT_STATUS.COMPLETED,
    level: PROJECT_LEVEL.FACULTY,
    award: {
      rank: 'Giải Nhất',
      prizeName: 'Giải E2E',
      cashAmount: 1000000,
      certificateCode: 'E2E-CERT-001',
      awardedAt: now,
      decisionNumber: 'E2E-DECISION-001',
    },
  });
  await upsertProject({
    code: 'SESS-E2E-COMPLETED-NO-AWARD',
    title: 'E2E đề tài hoàn tất chưa có giải',
    owner: student2,
    status: PROJECT_STATUS.COMPLETED,
    level: PROJECT_LEVEL.FACULTY,
    award: null,
  });

  const projectMemberships = [
    { project: rootDraft, owner: student1, members: [student2] },
    { project: rootNoRound, owner: student1, members: [student3] },
    { project: mentorshipProject, owner: student2, members: [student3] },
    { project: childProject, owner: student1, members: [student2] },
    { project: awardedProject, owner: student1, members: [] },
  ];
  for (const fixture of projectMemberships) {
    await upsertAcceptedMember({
      project: fixture.project,
      user: fixture.owner,
      role: PROJECT_MEMBER_ROLES.OWNER,
    });
    for (const member of fixture.members) {
      await upsertAcceptedMember({
        project: fixture.project,
        user: member,
        role: PROJECT_MEMBER_ROLES.MEMBER,
      });
    }
  }

  await Project.updateOne({ _id: rootDraft._id }, { $set: { isLinked: true } });
  await MentorAssignment.updateMany(
    { projectId: rootNoRound._id, status: ASSIGNMENT_STATUS.ASSIGNED },
    { $set: { status: ASSIGNMENT_STATUS.REASSIGNED, endedAt: now } },
  );
  await MentorAssignment.updateOne(
    { projectId: mentorshipProject._id, status: ASSIGNMENT_STATUS.ASSIGNED },
    {
      $setOnInsert: {
        projectId: mentorshipProject._id,
        mentorId: mentorUser._id,
        assignedBy: admin._id,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await Project.updateOne({ _id: mentorshipProject._id }, { $set: { judges: [judge._id] } });

  const evidenceBase = {
    submittedBy: student2._id,
    url: 'https://example.test/e2e-evidence.pdf',
    fileName: 'e2e-evidence.pdf',
    note: 'Fixture kiểm thử milestone.',
  };
  await Promise.all([
    upsertMilestone({
      project: mentorshipProject,
      mentor: mentorUser,
      title: 'E2E milestone chưa bắt đầu',
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    }),
    upsertMilestone({
      project: mentorshipProject,
      mentor: mentorUser,
      title: 'E2E milestone nộp đúng hạn',
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      evidence: {
        ...evidenceBase,
        submittedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        isLate: false,
      },
    }),
    upsertMilestone({
      project: mentorshipProject,
      mentor: mentorUser,
      title: 'E2E milestone nộp trễ',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      evidence: { ...evidenceBase, submittedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), isLate: true },
    }),
    upsertMilestone({
      project: mentorshipProject,
      mentor: mentorUser,
      title: 'E2E milestone quá hạn chưa nộp',
      startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    }),
    upsertMilestone({
      project: mentorshipProject,
      mentor: mentorUser,
      title: 'E2E milestone vượt hạn cho phép',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    }),
  ]);

  console.log('[Seed] Đã bảo đảm fixture đề tài, thành viên, vòng nộp, mentor/judge và milestone E2E.');
  await mongoose.disconnect();
};

seedStudentE2eFixtures().catch(async (error) => {
  console.error(`[Seed] Không thể tạo fixture E2E: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
