# Migration thông báo sau merge

Migration chưa được chạy trên database. Thực hiện trên bản sao database test trước; dừng các tiến trình ghi thông báo trong cửa sổ migration thật. Không chạy server merge mới với dữ liệu cũ trước khi hoàn tất kiểm tra/backfill/index.

## Hợp đồng

Trường chuẩn: recipientId, title, message, actionUrl, isRead, eventKey, metadata. Các alias userId/content/link/read và liên kết relatedEvaluationId/relatedProjectId/recipientRole được giữ. API đọc dữ liệu cũ bằng recipientId hoặc userId khi recipientId chưa có; không lọc bắt buộc recipientRole. Trạng thái đã đọc thắng nếu một trong read/isRead là true.

Migration chỉ backfill trường thiếu, đồng bộ trạng thái đọc và cấp eventKey `legacy:<ID>` khi thiếu. Không sửa _id, createdAt, updatedAt, metadata hoặc liên kết nghiệp vụ; không xóa bản ghi. Mâu thuẫn recipient, thiếu nội dung/tiêu đề, boolean sai hoặc eventKey trùng được báo theo ID và chặn apply trước lần ghi đầu tiên.

## Chuẩn bị và sao lưu

1. Sao lưu collection notifications bằng công cụ quản trị MongoDB/mongodump với quyền phù hợp; lưu cả định nghĩa index hiện có, database đích, thời điểm và số bản ghi. Không đưa URI/mật khẩu vào repo hay báo cáo.
2. Khôi phục thử bản sao vào database test riêng để kiểm tra bản backup dùng được. Chạy dry-run và các kiểm thử integration trên DB test đã allowlist. Runner integration hiện có xóa database test, tuyệt đối không trỏ nó tới database thật.
3. Trước apply thật, dừng nguồn ghi thông báo và chốt backup cuối. Nếu thiếu dữ liệu/khóa trùng, đối chiếu từng ID trong báo cáo; không tự chọn xóa dữ liệu để vượt qua kiểm tra.

## Chạy thủ công từ thư mục backend

Script không nạp file cấu hình môi trường. URI được truyền qua stdin, không qua argv và không in ra báo cáo. PowerShell ví dụ dưới đây dành cho bạn tự chạy, thay tên DB bằng database đã xác minh:

```powershell
$db = 'sess_notification_test'
$notificationCredential = Read-Host 'MongoDB URI' -AsSecureString
[System.Net.NetworkCredential]::new('', $notificationCredential).Password | node scripts/migrate-notifications.js "--database=$db" --dry-run
```

Không truyền `--apply` thì luôn dry-run. Dry-run không ghi và không tạo index, kể cả khi có `--create-index`. Kiểm tra `issues` rỗng, số `scanned/pending`, và database đích trước khi apply:

```powershell
[System.Net.NetworkCredential]::new('', $notificationCredential).Password | node scripts/migrate-notifications.js "--database=$db" --apply "--confirm-database=$db" --create-index
```

Model tắt autoIndex để tránh tạo unique index khi dữ liệu cũ chưa có eventKey. Phải hoàn tất `--create-index` và kiểm tra `indexCreated: true` trước khi nghiệm thu chống trùng đồng thời. Nếu index `eventKey_1` hiện có không tương thích, script báo `INDEX_CREATION_FAILED`; không tự drop index, không dùng syncIndexes. Bạn cần xem định nghĩa index và giải quyết riêng trong cửa sổ bảo trì.

Lần quét thứ hai trước tạo index phát hiện dữ liệu mới chưa backfill sẽ báo `PENDING_BACKFILL`. Nếu có `conflicts`, bản ghi đã thay đổi trong lúc migrate nên không bị ghi đè; dừng nguồn ghi và chạy lại. Migration có thể đã áp dụng một phần trước lỗi kết nối/index; xem `modified`, chạy lại an toàn sau khi xử lý nguyên nhân.

Sau apply chạy lại dry-run: `pending: 0`, `issues: []`. So sánh số bản ghi, ID, thời gian và liên kết với backup; kiểm tra đọc một/tất cả qua student, mentor, judge. Sau đó mới mở lại nguồn ghi.

## Khôi phục khi cần

Giữ nguồn ghi dừng, giữ lại bản sao trạng thái sau lỗi để đối chiếu. Khôi phục backup vào collection/database tạm và so sánh theo _id trước khi thay thế collection notifications thật. Chỉ khôi phục collection và index đã xác minh, không khôi phục đè toàn database hoặc xóa index khác. Các bản ghi mới sinh sau backup cần được đối soát riêng để tránh mất thông báo.

