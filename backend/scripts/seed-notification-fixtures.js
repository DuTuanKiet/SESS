/** Tạo một thông báo mẫu cho mỗi tài khoản thử nghiệm; upsert theo khóa cố định, không xóa dữ liệu. */
const { blockDotenvConfig, getTestMongoUri } = require('./testDatabaseGuard');
blockDotenvConfig();

const targetArg = process.argv.slice(2).find((argument) => argument.startsWith('--target='));
const target = targetArg ? targetArg.slice('--target='.length) : 'integration';
const mongoUri = getTestMongoUri(target);
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongoUri;

const mongoose = require('mongoose');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');

const getTargetUrl = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'mentor' || role === 'teacher') return '/advisor';
  if (role === 'judge') return '/judge';
  return '/student/projects';
};

const seedNotificationFixtures = async () => {
  await mongoose.connect(mongoUri);
  const users = await User.find({ status: 'ACTIVE' }).select('_id role').lean();

  for (const user of users) {
    const eventKey = `seed-notification:${user._id}`;
    await Notification.updateOne(
      { eventKey },
      {
        $setOnInsert: {
          recipientId: user._id,
          title: 'Thông báo mẫu đã sẵn sàng',
          message: 'Thông báo này được tạo từ fixture thử nghiệm của SESS.',
          type: 'system',
          isRead: false,
          actionUrl: getTargetUrl(user.role),
          metadata: { isFixture: true },
          eventKey,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`[Seed] Đảm bảo có thông báo mẫu cho ${users.length} tài khoản trong DB thử nghiệm.`);
  await mongoose.disconnect();
};

seedNotificationFixtures().catch(async (error) => {
  console.error(`[Seed] Không thể tạo notification fixture: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
