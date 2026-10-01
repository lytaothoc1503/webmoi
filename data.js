/* ====== DỮ LIỆU CÓ SẴN CHO WEB (dùng khi chưa nối Supabase) ======
   price: 0 nghĩa là "Liên hệ báo giá". Ảnh mẫu lấy từ Unsplash — nên thay bằng ảnh thật của nhà.
   Cách thay ảnh: bỏ ảnh vào thư mục images/ rồi đổi thành 'images/ten-anh.jpg'.
   Các mục ghi "MẪU" là nội dung tạm, hãy sửa cho đúng thực tế trước khi nhận khách. */
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
window.SITE_DATA = {
  rooms: [
    { name: 'Phòng Đôi Gỗ View Thung Lũng', price: 0, image_url: U('1505691938895-1758d7feb511'), perks: ['Không gian gỗ ấm cúng', 'Ngắm mây từ khung cửa', 'Chăn đệm ấm cho đêm núi'] }, // MẪU
    { name: 'Phòng Gia Đình', price: 0, image_url: U('1522708323590-d24dbb6b0267'), perks: ['Phù hợp nhóm nhỏ, gia đình', 'Không gian rộng rãi', 'Gần khu ngắm mây'] }, // MẪU
    { name: 'Giường Tập Thể (Dorm)', price: 0, image_url: U('1618773928121-c32242e63f39'), perks: ['Phù hợp nhóm bạn', 'Tiết kiệm chi phí', 'Không gian chung vui vẻ'] }, // MẪU
  ],
  tours: [
    { name: 'Săn Mây Bình Minh', price: 0, image_url: U('1500530855697-b586d89ba3ee'), description: 'Dậy sớm đón biển mây và ánh bình minh trên đỉnh núi Tà Xùa.' },
    { name: 'Chinh Phục Sống Lưng Khủng Long', price: 0, image_url: U('1464822759023-fed622ff2c3b'), description: 'Cung đường nổi tiếng với những dốc núi uốn lượn giữa biển mây.' },
    { name: 'Rừng Chè Shan Tuyết Cổ Thụ', price: 0, image_url: U('1441974231531-c6227db76b6e'), description: 'Dạo bước giữa những gốc chè cổ thụ trong không khí se lạnh của núi rừng.' },
  ],
  gallery: [
    { image_url: U('1469474968028-56623f02e42e', 1000), caption: 'Tà Xùa buổi sớm' },
    { image_url: U('1500530855697-b586d89ba3ee', 1000), caption: 'Thung lũng mây' },
    { image_url: U('1470071459604-3b5ec3a7fe05', 1000), caption: 'Rừng núi Tây Bắc' },
    { image_url: U('1501785888041-af3ef285b470', 1000), caption: 'Hoàng hôn trên núi' },
    { image_url: U('1505691938895-1758d7feb511', 1000), caption: 'Không gian nghỉ ngơi' },
    { image_url: U('1464822759023-fed622ff2c3b', 1000), caption: 'Dốc núi giữa mây' },
  ],
  // Chưa có đánh giá thật nên để trống: mục "Khách Nói" sẽ tự ẩn. Khi có, thêm theo mẫu:
  // { author_name: 'Tên khách', rating: 5, content: 'Nội dung đánh giá' }
  reviews: [],
  faq: [
    { question: 'Làm sao để đặt phòng?', answer: 'Bạn bấm "Đặt Phòng" và điền thông tin, hoặc nhắn trực tiếp qua Facebook của nhà. Nhà sẽ liên hệ xác nhận với bạn.' }, // MẪU
    { question: 'Giờ nhận và trả phòng như thế nào?', answer: 'Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần đến sớm hoặc gửi hành lý, hãy báo trước cho nhà.' }, // MẪU
    { question: 'Thời điểm nào săn mây đẹp nhất?', answer: 'Mùa săn mây ở Tà Xùa thường từ cuối tháng 9 đến tháng 4 năm sau. Thời tiết thay đổi theo ngày nên nhà sẽ tư vấn thêm khi bạn liên hệ.' },
    { question: 'Nhà có hỗ trợ tư vấn lịch trình không?', answer: 'Có. Bạn nhắn cho nhà thời gian dự định đến, nhà sẽ gợi ý lịch trình săn mây và các điểm tham quan gần đó.' }, // MẪU
  ],
};
