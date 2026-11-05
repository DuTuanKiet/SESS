const newsController = {
  /**
   * GET /api/v1/news
   * Trả về danh sách tin tức mẫu (dành cho trang chủ public-site).
   * Hiện tại trả về danh sách rỗng/mẫu vì module tin tức chưa được xây dựng đầy đủ.
   */
  getNews: async (_req, res) => {
    const sampleNews = [
      {
        id: 1,
        title: 'Khai mạc Cuộc thi Khởi nghiệp sinh viên CTUT năm 2026',
        category: 'Thông báo',
        publishedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        thumbnail: null,
        summary: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ chính thức khai mạc cuộc thi Khởi nghiệp sinh viên.',
      },
      {
        id: 2,
        title: 'Hội thảo "Từ ý tưởng đến khởi nghiệp"',
        category: 'Tin tức',
        publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        thumbnail: null,
        summary: 'Hướng dẫn quy trình viết hồ sơ dự án và kinh nghiệm từ chuyên gia.',
      },
      {
        id: 3,
        title: 'Danh sách dự án được chọn vòng sơ khảo SESS 2026',
        category: 'Sự kiện',
        publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        thumbnail: null,
        summary: 'Công bố danh sách các đội dự án đủ điều kiện tham gia vòng phỏng vấn.',
      },
    ];

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tin tức thành công.',
      data: sampleNews,
    });
  },

  /**
   * GET /api/v1/news/:id
   * Trả về chi tiết một tin tức (mẫu).
   */
  getNewsById: async (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết tin tức thành công.',
      data: {
        id: req.params.id,
        title: 'Tin tức mẫu',
        category: 'Thông báo',
        content: 'Nội dung tin tức mẫu.',
        publishedAt: new Date().toISOString(),
        thumbnail: null,
      },
    });
  },
};

module.exports = newsController;
