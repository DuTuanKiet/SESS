const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Mentor = require('../src/models/Mentor');
const { USER_ROLES, USER_STATUS, AUTH_PROVIDERS, MENTOR_STATUS } = require('../src/utils/constants');

const run = async () => {
  await mongoose.connect(env.mongoUri);
  const email = 'dukiet205@gmail.com';
  const password = 'Mentor@12345';
  const payload = {
    email,
    password,
    role: USER_ROLES.MENTOR,
    systemRole: 'teacher',
    status: USER_STATUS.ACTIVE,
    authProvider: AUTH_PROVIDERS.LOCAL,
    isEmailVerified: true,
    fullName: 'Dư Tuấn Kiệt',
    phone: '0901234567',
    department: 'Khoa Công nghệ Thông tin',
    position: 'Giảng viên / Thạc sĩ / Kỹ sư hướng dẫn',
    staffCode: 'GV-CTUT-2026',
  };
  let user = await User.findOne({ email });
  if (user) { user.set(payload); await user.save(); }
  else { user = await User.create(payload); }

  await Mentor.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        email,
        fullName: 'Dư Tuấn Kiệt',
        staffCode: 'GV-CTUT-2026',
        faculty: 'Khoa Công nghệ Thông tin',
        phone: '0901234567',
        position: 'Giảng viên / Thạc sĩ / Kỹ sư hướng dẫn',
        expertise: ['Công nghệ phần mềm', 'Lập trình web'],
        fields: ['Kỹ thuật phần mềm', 'Đồ án tốt nghiệp'],
        bio: 'Giảng viên Khoa CNTT, hướng dẫn đồ án và nghiên cứu ứng dụng.',
        status: MENTOR_STATUS.ACTIVE,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[Seed] Lecturer ready: ${email} / ${password}`);
  await mongoose.disconnect();
};
run().catch((e) => { console.error(e); process.exit(1); });