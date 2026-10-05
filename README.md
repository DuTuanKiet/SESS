# SESS - Student Entrepreneurship Support System

## Cấu trúc dự án

```
sess-ctut/
├── backend/                     # Node.js + Express 5 + MongoDB (Mongoose)
│   ├── server.js                # Kết nối DB rồi start server (graceful shutdown)
│   ├── scripts/
│   │   ├── seed-user.js         # Tạo/reset tài khoản test (admin, student, teacher, mentor)
│   │   └── cleanup.js           # Xoá dữ liệu test khỏi MongoDB (Node.js thuần + Mongoose)
│   └── src/
│       ├── app.js               # Khai báo middleware + mount /api/v1 + Error Middleware
│       ├── config/              # env.js (đọc .env), database.js (kết nối MongoDB)
│       ├── models/              # user.model.js, otp.model.js
│       ├── services/            # auth.service.js, token.service.js, user.service.js
│       ├── controllers/         # auth.controller.js, user.controller.js
│       ├── middlewares/         # auth.middleware.js (JWT + RBAC), error.middleware.js
│       ├── routes/              # index.js, auth.route.js, user.route.js, admin.route.js
│       └── utils/               # api-error, constants, mailer, security, validation
├── frontend/                    # Vue 3 + Vite
├── thunder-tests.json           # Thunder Client collection (import 1 lần, chạy test thủ công)
└── package.json                 # Script chạy đồng thời backend + frontend
```

## Chạy dự án

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # rồi điền JWT secret, GOOGLE_CLIENT_ID, SMTP... nếu cần
npm run seed:admin          # admin@ctuet.edu.vn / Admin@12345
npm run seed:student        # 110122001@student.ctuet.edu.vn / Student@12345 (chưa xác thực)
npm run dev                 # nodemon server.js -> http://localhost:5000/api/v1

# 2. Frontend
cd frontend
npm install
npm run dev
```

Yêu cầu: Node.js >= 18, MongoDB đang chạy (`mongodb://127.0.0.1:27017/sess_db`).

### Script tiện ích (backend)

| Lệnh | Mô tả |
|---|---|
| `npm run seed` | **Seed dữ liệu sạch chuẩn**: dọn dữ liệu phát sinh + nạp danh sách sinh viên + tạo tài khoản mẫu (sv chính chưa xác thực để test OTP, sv phụ đã xác thực, admin) |
| `npm run seed:whitelist` | Chỉ nạp danh sách sinh viên của trường (`StudentWhitelist`) |
| `npm run seed:admin` | Tạo/reset admin đã xác thực (`ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`) |
| `npm run seed:student` | Tạo/reset sinh viên **chưa xác thực** (`STUDENT_EMAIL` / `STUDENT_PASSWORD` / `STUDENT_ID`) |
| `npm run cleanup` | Xoá user test (email bắt đầu bằng `sv`, `test`, `demo`, `seed` hoặc `STUDENT_EMAIL`) + toàn bộ OTP |
| `npm run cleanup -- --all` | Xoá toàn bộ user (giữ lại `ADMIN_EMAIL`) + toàn bộ OTP |
| `npm run cleanup -- --email=a@student.ctuet.edu.vn,b@student.ctuet.edu.vn` | Xoá chính xác theo email |

```bash
node scripts/seed-user.js --role=teacher --email=gv01@ctuet.edu.vn --password=Teacher@123
node scripts/seed-user.js --role=student --email=110122002@student.ctuet.edu.vn --student-id=110122002 --verified
```

### Biến môi trường chính (`backend/.env`)

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `PORT` / `MONGO_URI` | `5000` / `mongodb://127.0.0.1:27017/sess_db` | |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | (dev fallback) | **Bắt buộc đổi ở production** - env.js sẽ throw nếu thiếu |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `7d` | |
| `OTP_LENGTH`, `OTP_EXPIRES_MINUTES`, `OTP_MAX_ATTEMPTS` | `6`, `5`, `5` | |
| `EXPOSE_OTP_IN_DEV` | `true` | **CHỈ DEV**: trả OTP trong response để test nhanh; production luôn tắt |
| `GOOGLE_CLIENT_ID` | (trống) | Web client ID để verify `idToken` |
| `SMTP_*`, `MAIL_FROM` | (trống) | Để trống ⇒ email được in ra console (chế độ dev) |

## Luồng xác thực

**Sinh viên không tự đăng ký.** Tài khoản có 2 nguồn:

1. **Nhà trường cấp sẵn** (Local, có mật khẩu tạm) → đăng nhập lần đầu trả `403 EMAIL_NOT_VERIFIED`, hệ thống sinh OTP 6 số (hết hạn 5 phút) gửi tới email trường → `POST /auth/verify-otp` để kích hoạt và nhận token.
2. **Đăng nhập Google** với email `@student.ctuet.edu.vn`:
   - Email chưa có trong DB → tự tạo `role=student`, `isEmailVerified=true`, `authProvider=GOOGLE`, MSSV trích xuất từ email, gửi email chào mừng (Nodemailer).
   - Email đã có trong DB → **tự động account linking** (gán `googleId`, `isEmailVerified=true`), không tạo tài khoản trùng; giữ mật khẩu để vẫn đăng nhập Local được.
   - Email ngoài domain sinh viên và chưa được cấp tài khoản → `403 DOMAIN_NOT_ALLOWED`. Admin/GV đã được cấp sẵn vẫn đăng nhập Google bình thường.

**Phiên đăng nhập:** Access token 15 phút + Refresh token 7 ngày, lưu **hash SHA-256** của refresh token trong `user.refreshTokens` (tối đa `MAX_ACTIVE_SESSIONS` thiết bị). Refresh có **rotation** (token cũ bị thu hồi ngay). Tài khoản bị `SUSPENDED` bị cắt toàn bộ phiên.

## Danh sách API (base: `/api/v1`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/auth/login` | Public | Đăng nhập email/mật khẩu |
| POST | `/auth/verify-otp` | Public | Xác thực OTP kích hoạt tài khoản (trả luôn token) |
| POST | `/auth/google` | Public | Đăng nhập/tự tạo/liên kết tài khoản bằng Google `idToken` |
| POST | `/auth/refresh-token` | Public (cần refresh token) | Cấp access token mới (rotation) |
| POST | `/auth/logout` | Public (cần refresh token) | Thu hồi refresh token (`allSessions=true` để thu hồi mọi thiết bị) |
| GET | `/users/me` | Đã đăng nhập | Profile cá nhân |
| PATCH | `/admin/users/:id/status` | `checkRole('admin')` | Đổi `status` `ACTIVE`/`SUSPENDED` |

**FR02 - Hồ sơ cá nhân (`UserProfile`, 1-1 với `User`)**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/users/profile/me` | Lấy hồ sơ (tự khởi tạo + đồng bộ Họ tên/MSSV/Lớp/Email CVHT từ `StudentWhitelist`) |
| PUT | `/users/profile/me` | Cập nhật thông tin bổ trợ (`bio`, `skills`, `phone`, `avatarUrl`, `socialLinks`) - **không sửa được** MSSV/Email/Họ tên/Lớp |

**FR03 - Dự án & lịch sử phiên bản (`Project`, `ProjectRevision`)**

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/projects` | Tạo dự án: người tạo tự động là `OWNER`, `status = DRAFT`, `version = 1`, mã tự sinh `SESS-<năm>-<số>` |
| PUT | `/projects/:id` | Sửa dự án: chỉ `OWNER/MEMBER` (đã ACCEPTED) và chỉ khi `DRAFT`/`NEED_REVISION`, ngược lại **403** |
| POST | `/projects/:id/submit` | Nộp dự án: fail fast nếu thiếu `title/category/abstract/solution`; thành công ⇒ lưu snapshot `ProjectRevision` + `SUBMITTED` + `version + 1` |
| GET | `/projects/:id/revisions` | Lịch sử các phiên bản đã nộp (chỉ thành viên dự án) |

**FR04 - Thành viên dự án (`ProjectMember`)**

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/projects/:id/members/invite` | `OWNER` mời theo email: email phải có trong `StudentWhitelist` (404) và đã kích hoạt (400) mới gửi lời mời |
| POST | `/projects/invitations/:invitationId/respond` | Người được mời phản hồi `ACCEPTED`/`REJECTED` |
| DELETE | `/projects/:id/members/:userId` | `OWNER` xoá thành viên (không xoá được chính `OWNER`) |
| POST | `/projects/:id/members/transfer-ownership` | Chuyển quyền `OWNER` cho thành viên đã `ACCEPTED` |
| POST | `/projects/:id/members/leave` | Thành viên rời nhóm; `OWNER` phải chuyển quyền trước (nếu không ⇒ 400) |


Định dạng response thống nhất:

```jsonc
// Thành công
{ "success": true, "message": "...", "data": { } }

// Lỗi (mọi lỗi đều do Error Middleware chuẩn hoá)
{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": { } }
```

### Bảng mã lỗi (`code`)

| Nhóm | HTTP | `code` |
|---|---|---|
| Dữ liệu vào | 400 | `MISSING_FIELD`, `INVALID_EMAIL`, `INVALID_OTP_FORMAT`, `INVALID_VALUE`, `INVALID_JSON_BODY`, `VALIDATION_ERROR` |
| OTP | 400 / 429 | `OTP_NOT_FOUND`, `OTP_EXPIRED`, `OTP_INVALID`, `OTP_MAX_ATTEMPTS` |
| Đăng nhập | 401 / 403 | `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_SUSPENDED`, `USE_GOOGLE_LOGIN` |
| Token | 401 | `MISSING_ACCESS_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_ACCESS_TOKEN`, `INVALID_REFRESH_TOKEN`, `SESSION_REVOKED` |
| Google | 400 / 401 / 403 / 503 | `MISSING_GOOGLE_ID_TOKEN`, `INVALID_GOOGLE_TOKEN`, `INVALID_GOOGLE_PROFILE`, `GOOGLE_EMAIL_NOT_VERIFIED`, `DOMAIN_NOT_ALLOWED`, `GOOGLE_NOT_CONFIGURED` |
| Phân quyền & tài nguyên | 400 / 403 / 404 / 409 | `INSUFFICIENT_ROLE`, `CANNOT_SUSPEND_SELF`, `USER_NOT_FOUND`, `ROUTE_NOT_FOUND`, `INVALID_ID`, `DUPLICATE_KEY` |
| Hệ thống | 413 / 500 / 503 | `PAYLOAD_TOO_LARGE`, `INTERNAL_ERROR`, `MAIL_SEND_FAILED` |
| Hồ sơ (FR02) | 400 | `SCHOOL_MANAGED_FIELD`, `INVALID_URL`, `INVALID_PHONE`, `INVALID_FIELD`, `NOTHING_TO_UPDATE` |
| Dự án (FR03) | 400 / 403 / 404 / 409 | `PROJECT_NOT_EDITABLE`, `PROJECT_NOT_SUBMITTABLE`, `MISSING_REQUIRED_FIELDS`, `NOT_PROJECT_MEMBER`, `MEMBERSHIP_NOT_ACCEPTED`, `NOT_PROJECT_OWNER`, `PROJECT_NOT_FOUND`, `PROJECT_CODE_CONFLICT` |
| Thành viên (FR04) | 400 / 403 / 404 / 409 | `STUDENT_NOT_IN_WHITELIST`, `INVITEE_NOT_ACTIVATED`, `INVITEE_SUSPENDED`, `CANNOT_INVITE_SELF`, `OWNER_MUST_TRANSFER`, `CANNOT_REMOVE_OWNER`, `ALREADY_OWNER`, `MEMBER_NOT_ACCEPTED`, `MEMBER_ALREADY_JOINED`, `INVITATION_ALREADY_SENT`, `INVITATION_NOT_FOUND`, `INVITATION_ALREADY_RESPONDED`, `INVALID_INVITATION_RESPONSE`, `NOT_INVITATION_RECEIVER`, `MEMBER_NOT_FOUND` |

## Bảo mật & checklist production

- Mật khẩu hash bằng bcrypt (`BCRYPT_SALT_ROUNDS=10`), trường `password` có `select: false` và luôn bị loại khỏi `toJSON` (cùng `refreshTokens`, `googleId`).
- OTP lưu dạng hash SHA-256 + TTL index (MongoDB tự xoá), giới hạn `OTP_MAX_ATTEMPTS` lần thử, so sánh bằng `crypto.timingSafeEqual`.
- Refresh token lưu hash + rotation; khoá tài khoản ⇒ thu hồi toàn bộ phiên.
- Middleware `authenticate` đọc `status` realtime từ DB nên tài khoản bị khoá bị chặn ngay (403), kể cả khi access token còn hạn.
- RBAC bằng `checkRole('admin', 'teacher')`; `PATCH /admin/**` chỉ dành cho admin.
- Checklist khi deploy: đổi `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`, đặt `NODE_ENV=production` (tự bật kiểm tra biến bắt buộc + tắt lộ OTP + ẩn stack trace), cấu hình SMTP thật, khai báo `GOOGLE_CLIENT_ID` đúng domain frontend, giới hạn `CORS_ORIGIN`.

### Safe-guard gửi mail ở môi trường dev

- Chỉ gửi mail **thật** tới email test chính `dtkietktpm2311025@student.ctuet.edu.vn`; mọi địa chỉ khác trong `development` chỉ in log
  `[DEV MAILER SIMULATION] Gửi email đến: ...` để tránh Gmail trả về thư phản hồi *Mail Delivery Subsystem 550* khi test với email sinh viên mẫu không tồn tại.
- Nếu chưa cấu hình `SMTP_*`, hệ thống tự chuyển sang chế độ in toàn bộ nội dung email ra console.
- Ở `production`, không có mô phỏng: mọi email đều được gửi thật qua SMTP.


## Test API bằng Thunder Client

1. Chuẩn bị dữ liệu: `cd backend && npm run seed:admin && npm run seed:student` (reset: `npm run cleanup`).
2. VS Code → Thunder Client → tab **Collections** → menu → **Import** → chọn `thunder-tests.json` ở thư mục gốc.
3. Bấm **Run All** (hoặc chạy từng folder theo thứ tự):
   - `1. Auth (OTP)` – login lần đầu (403) → OTP → verify → login → refresh → logout.
   - `2. Users` – `/users/me` (tự set biến `{{userId}}`).
   - `3. Admin & RBAC` – login admin (tự set `{{adminAccessToken}}`) → khoá/mở khoá sinh viên, kiểm tra 403 khi bị SUSPENDED và 403 RBAC.
   - `4. Google OAuth` – cần `GOOGLE_CLIENT_ID` + `idToken` thật ở biến `{{googleIdToken}}`.
   - `5. Negative Cases` – các lỗi 400/401/404 tiêu biểu (`/auth/register` đã bị loại bỏ ⇒ 404).
4. Các biến `{{otp}}`, `{{accessToken}}`, `{{refreshToken}}`, `{{userId}}`, `{{adminAccessToken}}`, `{{adminUserId}}` được **set tự động** bởi test "Set Env Variable" sau mỗi request. Nếu bản Thunder Client của bạn không chạy loại test này, chỉ cần copy giá trị từ response và dán vào biến môi trường tương ứng (Env tab) rồi chạy lại.
5. Ở dev, OTP được in ra console server (`[MAIL:DEV]`) và trả kèm trong `errors.devOtp` của response 403 để tiện test.


