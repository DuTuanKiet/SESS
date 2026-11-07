/** `npm run seed` chuẩn bị integration; `npm run seed:e2e` thêm fixture nghiệp vụ E2E an toàn. */
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { blockDotenvConfig, getTestMongoUri } = require('./testDatabaseGuard');

blockDotenvConfig();

const parseArgs = (argv) =>
  argv.reduce((result, argument) => {
    if (!argument.startsWith('--')) return result;
    const [key, value] = argument.slice(2).split('=');
    result[key] = value === undefined ? true : value;
    return result;
  }, {});

const args = parseArgs(process.argv.slice(2));
const target = String(args.target || 'integration');
const mongoUri = getTestMongoUri(target);

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongoUri;

const seedSteps = [
  { file: 'seed-whitelist.js', args: [] },
  { file: 'seed-user.js', args: ['--role=admin'] },
  { file: 'seed-user.js', args: ['--role=student'] },
  ...['110122001', '110122002', '110122003'].map((studentId) => ({
    file: 'seed-user.js',
    args: [
      `--email=${studentId}@student.ctuet.edu.vn`,
      `--student-id=${studentId}`,
      '--role=student',
      '--verified',
    ],
  })),
  { file: 'seed-user.js', args: ['--role=teacher'] },
  { file: 'seed-user.js', args: ['--role=mentor'] },
  { file: 'seed-user.js', args: ['--role=judge'] },
];

if (target === 'e2e') {
  seedSteps.push({ file: 'seed-student-e2e-fixtures.js', args: [] });
}
seedSteps.push({ file: 'seed-notification-fixtures.js', args: [] });

for (const step of seedSteps) {
  console.log(`[Seed] Thêm fixture bằng ${step.file}.`);
  execFileSync(
    process.execPath,
    [path.join(__dirname, step.file), ...step.args, `--target=${target}`],
    {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, MONGO_URI: mongoUri },
      stdio: 'inherit',
    },
  );
}

console.log(`[Seed] Hoàn tất fixture cho database thử nghiệm ${target}.`);
