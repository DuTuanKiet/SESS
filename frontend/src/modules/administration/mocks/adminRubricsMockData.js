/**
 * Dữ liệu mock tĩnh cho phân hệ Quản lý Bộ tiêu chí đánh giá (Rubrics)
 * Phục vụ xem trước giao diện và trải nghiệm quản trị không phụ thuộc kết nối Backend
 */

export const BASE_RUBRICS = [
  {
    id: 'r1',
    name: 'Tiêu chí Vòng Sơ khảo',
    version: 2,
    status: 'Active',
    description: 'Bộ tiêu chí đánh giá toàn diện dành cho các đề tài bước vào vòng sơ tuyển cấp Trường.',
    criteria: [
      {
        id: 'c1-1',
        name: 'Tính mới & sáng tạo',
        desc: 'Mức độ khác biệt so với giải pháp hiện có, tính độc đáo và tiềm năng sở hữu trí tuệ.',
        weight: 30,
        min: 0,
        max: 10,
      },
      {
        id: 'c1-2',
        name: 'Tính khả thi',
        desc: 'Nguồn lực kỹ thuật, kế hoạch triển khai và khả năng hoàn thành nguyên mẫu trong thời gian quy định.',
        weight: 25,
        min: 0,
        max: 10,
      },
      {
        id: 'c1-3',
        name: 'Mô hình kinh doanh',
        desc: 'Xác định khách hàng mục tiêu, luồng doanh thu, cơ cấu chi phí và tiềm năng thị trường.',
        weight: 25,
        min: 0,
        max: 10,
      },
      {
        id: 'c1-4',
        name: 'Năng lực đội ngũ',
        desc: 'Phân vai rõ ràng, năng lực chuyên môn và mức độ cam kết của các thành viên trong nhóm.',
        weight: 20,
        min: 0,
        max: 10,
      },
    ],
  },
  {
    id: 'r2',
    name: 'Tiêu chí Vòng Chung kết',
    version: 1,
    status: 'Draft',
    description: 'Tiêu chuẩn thẩm định sản phẩm MVP và kỹ năng pitching trước hội đồng giám khảo doanh nghiệp.',
    criteria: [
      {
        id: 'c2-1',
        name: 'Sản phẩm mẫu',
        desc: 'Mức hoàn thiện MVP và trải nghiệm người dùng thực tế.',
        weight: 40,
        min: 0,
        max: 10,
      },
      {
        id: 'c2-2',
        name: 'Thuyết trình',
        desc: 'Kỹ năng pitching, trả lời phản biện và bảo vệ luận điểm.',
        weight: 30,
        min: 0,
        max: 10,
      },
    ],
  },
  {
    id: 'r3',
    name: 'Tiêu chí Vòng Sơ khảo',
    version: 1,
    status: 'Deprecated',
    description: 'Phiên bản sơ khảo lưu trữ năm học 2024–2025, đã ngừng áp dụng.',
    criteria: [],
  },
];

/**
 * Trả về bản sao độc lập của trạng thái mock ban đầu để tránh đột biến chia sẻ
 */
export function createInitialRubricsMockState() {
  return JSON.parse(JSON.stringify(BASE_RUBRICS));
}
