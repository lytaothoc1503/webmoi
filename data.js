/* ====== DỮ LIỆU CÓ SẴN CHO WEB (dùng khi chưa nối Supabase) ======
   GIÁ HIỆN LÀ GIÁ MẪU (đơn vị VNĐ), hãy sửa đúng giá thật của nhà. price: 0 nghĩa là "Liên hệ báo giá". Ảnh mẫu lấy từ Unsplash — nên thay bằng ảnh thật của nhà.
   Cách thay ảnh: bỏ ảnh vào thư mục images/ rồi đổi thành 'images/ten-anh.jpg'.
   Các mục ghi "MẪU" là nội dung tạm, hãy sửa cho đúng thực tế trước khi nhận khách. */
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
window.SITE_DATA = {
  rooms: [
    { name: 'Phòng Đôi Gỗ View Thung Lũng', price: 850000, image_url: 'images/phong-view-may.jpg', guests: '2 khách', bed: '1 giường đôi', view: 'View thung lũng, biển mây', perks: ['Không gian gỗ ấm cúng', 'Ngắm mây từ khung cửa', 'Chăn đệm ấm cho đêm núi'] }, // MẪU
    { name: 'Phòng Gia Đình', price: 1600000, image_url: U('1522708323590-d24dbb6b0267'), guests: '4 khách', bed: '2 giường đôi', view: 'View núi rừng', perks: ['Phù hợp nhóm nhỏ, gia đình', 'Không gian rộng rãi', 'Gần khu ngắm mây'] }, // MẪU
    { name: 'Giường Tập Thể (Dorm)', price: 250000, image_url: U('1618773928121-c32242e63f39'), guests: '1 khách / giường', bed: 'Giường tầng', view: 'Không gian chung', perks: ['Phù hợp nhóm bạn', 'Tiết kiệm chi phí', 'Không gian chung vui vẻ'] }, // MẪU
  ],
  tours: [
    { name: 'Săn Mây Bình Minh', price: 300000, image_url: 'images/vay-tay-bien-may.jpg', description: 'Dậy sớm đón biển mây và ánh bình minh trên đỉnh núi Tà Xùa.' },
    { name: 'Chinh Phục Sống Lưng Khủng Long', price: 500000, image_url: U('1464822759023-fed622ff2c3b'), description: 'Cung đường nổi tiếng với những dốc núi uốn lượn giữa biển mây.' },
    { name: 'Rừng Chè Shan Tuyết Cổ Thụ', price: 350000, image_url: U('1441974231531-c6227db76b6e'), description: 'Dạo bước giữa những gốc chè cổ thụ trong không khí se lạnh của núi rừng.' },
  ],
  gallery: [
    { image_url: 'images/hero-san-may.jpg', caption: 'Biển mây Tà Xùa' },
    { image_url: 'images/hoang-hon-fisheye.jpg', caption: 'Hoàng hôn rực lửa' },
    { image_url: 'images/tram-mam-xoi.jpg', caption: 'Trạm Mầm Xôi cà phê' },
    { image_url: 'images/ruong-bac-thang.jpg', caption: 'Ruộng bậc thang mùa chín' },
    { image_url: 'images/bap-treo-cua-so.jpg', caption: 'Bắp treo bên khung cửa' },
    { image_url: 'images/bang-hay-lay-toi-di.jpg', caption: 'Bữa sáng "Hãy lấy tôi đi"' },
    { image_url: 'images/hay-lay-toi-di-cabin.jpg', caption: 'Góc check-in ở nhà gỗ' },
    { image_url: 'images/den-long-hoang-hon.jpg', caption: 'Đèn lồng lên đèn trên biển mây' },
    { image_url: 'images/phong-view-may.jpg', caption: 'Giường cạnh khung cửa ngắm mây' },
    { image_url: 'images/nha-go-den-long.jpg', caption: 'Nhà gỗ giữa đồi xanh' },
    { image_url: 'images/ngam-bien-may.jpg', caption: 'Nằm trong phòng ngắm biển mây' },
    { image_url: 'images/ban-ghe-ngam-may.jpg', caption: 'Góc ban công ngắm mây' },
    { image_url: 'images/hoang-hon-quan-cafe.jpg', caption: 'Hoàng hôn từ quán cà phê' },
    { image_url: 'images/bac-da-nha-go.jpg', caption: 'Bậc đá dẫn lối đến nhà gỗ' },
    { image_url: 'images/vay-tay-bien-may.jpg', caption: 'Chào buổi sáng trên mây' },
    { image_url: 'images/bua-sang-tren-may.jpg', caption: 'Bữa sáng nóng giữa trời mây' },
  ],
  // Đánh giá thật từ Google Maps (khách đã đăng công khai). Thêm mới theo mẫu: { author_name, rating, content }
  reviews: [
    { author_name: 'Thu Vu', rating: 5, content: 'Phòng ốc sạch sẽ, ấm cúng. Mình lên thời điểm 20-22/8/25 thời tiết đẹp, sáng sớm mưa lất phất, tầm 9h sáng trở đi mây phủ giăng khắp cả ngọn đồi trông rất chill. Dù vậy nhiệt độ chỉ tầm 19-20° nên rất đã. Các bạn nhân viên nhiệt tình dễ thương. Dù đi bộ lên khá mệt nhưng suy nghĩ như đi tập thể dục thì cũng vui. Đừng lo về hành lí vì đã có các bạn nhân viên hỗ trợ mang lên xuống.' },
    { author_name: 'Vy Anh Trần', rating: 5, content: 'Chị chủ nhiệt tình, dễ thương. Nhân viên phục vụ chu đáo nhiệt tình. Phòng và cafe view đẹppp, dễ săn mây, giá cả hợp lí. Đặt combo 3n2d bao gồm ăn sáng (mì thập cẩm), phòng và xe khứ hồi 1tr2 + mua nước ở cafe đc giảm 15% và home cũng có dv cho thuê xe máy nên rất tiện, gần trung tâm. Phòng mình ở là An 9, giường ở 3 người vẫn rộng rãi thoải mái. Mỗi tội từ phòng leo lên mệt muốn đứt hơi.' },
  ],
  // Câu chuyện chủ nhà. MẪU: sửa thành câu chuyện thật rồi đổi storyIsSample thành false để ẩn nhãn "nội dung mẫu".
  story: [
    'Nhà của An bắt đầu từ một mong muốn giản dị: có một góc nhỏ trên Tà Xùa để khách dừng chân, uống ly cà phê nóng và nhìn mây trôi dưới chân mình.',
    'Chúng tôi giữ nhà thật mộc, thật ấm, để mỗi vị khách đến đây được nghỉ ngơi chậm lại giữa núi rừng Tây Bắc.',
  ],
  storySign: '— Chủ nhà An',
  storyIsSample: true,
  // Chính sách hoàn/hủy. MẪU: chủ nhà sửa theo thực tế. Hiện ở trang chính sách, FAQ và trang đơn.
  policyIsSample: true,
  cancelPolicy: [
    'Hủy trước ngày nhận phòng từ 7 ngày: hoàn 100% tiền đã chuyển.',
    'Hủy từ 3 đến 6 ngày trước ngày nhận phòng: hoàn 50%.',
    'Hủy dưới 3 ngày hoặc không đến: không hoàn tiền.',
    'Đổi ngày: báo trước ít nhất 3 ngày, tùy tình trạng phòng.',
    'Thời tiết xấu, đường bị chặn khiến không thể lên Tà Xùa: nhà hỗ trợ đổi ngày hoặc hoàn tiền, báo cho nhà qua Messenger.',
  ],
  faq: [
    { question: 'Chính sách hoàn / hủy phòng thế nào?', answer: 'Hủy trước 7 ngày hoàn 100%, từ 3 đến 6 ngày hoàn 50%, dưới 3 ngày không hoàn. Xem chi tiết ở trang Chính sách. Nếu thời tiết xấu khiến bạn không lên được, hãy nhắn nhà để được hỗ trợ.' }, // MẪU
    { question: 'Làm sao để đặt phòng?', answer: 'Bạn bấm "Đặt Phòng" và điền thông tin, hoặc nhắn trực tiếp qua Facebook của nhà. Nhà sẽ liên hệ xác nhận với bạn.' }, // MẪU
    { question: 'Giờ nhận và trả phòng như thế nào?', answer: 'Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần đến sớm hoặc gửi hành lý, hãy báo trước cho nhà.' }, // MẪU
    { question: 'Thời điểm nào săn mây đẹp nhất?', answer: 'Mùa săn mây ở Tà Xùa thường từ cuối tháng 9 đến tháng 4 năm sau. Thời tiết thay đổi theo ngày nên nhà sẽ tư vấn thêm khi bạn liên hệ.' },
    { question: 'Nhà có hỗ trợ tư vấn lịch trình không?', answer: 'Có. Bạn nhắn cho nhà thời gian dự định đến, nhà sẽ gợi ý lịch trình săn mây và các điểm tham quan gần đó.' }, // MẪU
  ],
};
