/* ====== DỮ LIỆU CỦA WEB (nguồn chính hiện nay) ======
   Mọi nội dung hiển thị cho khách nằm ở file này. Muốn sửa giá, ảnh, mô tả: sửa tại đây rồi đẩy lên GitHub.
   Đơn vị giá: VNĐ. price: 0 nghĩa là "Liên hệ báo giá".
   Giá phòng, tour, dịch vụ hiện là giá tạm, chờ nhà cập nhật giá thật. Ảnh nằm trong thư mục images/ (đổi thành 'images/ten-anh.jpg').
   Các bảng phòng/tour/ảnh/hỏi đáp trong Supabase hiện để trống: nếu có dữ liệu thì web sẽ dùng dữ liệu đó THAY CHO file này. */
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
window.SITE_DATA = {
  rooms: [
    { name: 'Phòng Đôi Gỗ View Thung Lũng', price: 850000, image_url: 'images/phong-view-may.jpg', guests: '2 khách', bed: '1 giường đôi', view: 'View thung lũng, biển mây', perks: ['Không gian gỗ ấm cúng', 'Ngắm mây từ khung cửa', 'Chăn đệm ấm cho đêm núi'] },
    { name: 'Phòng Gia Đình', price: 1600000, image_url: 'images/hay-lay-toi-di-cabin.jpg', guests: '4 khách', bed: '2 giường đôi', view: 'View núi rừng', perks: ['Phù hợp nhóm nhỏ, gia đình', 'Không gian rộng rãi', 'Gần khu ngắm mây'] },
    { name: 'Giường Tập Thể (Dorm)', price: 250000, image_url: 'images/bap-treo-cua-so.jpg', guests: '1 khách / giường', bed: 'Giường tầng', view: 'Không gian chung', perks: ['Phù hợp nhóm bạn', 'Tiết kiệm chi phí', 'Không gian chung vui vẻ'] },
  ],
  tours: [
    { name: 'Săn Mây Bình Minh', price: 300000, image_url: 'images/vay-tay-bien-may.jpg', description: 'Dậy sớm đón biển mây và ánh bình minh trên đỉnh núi Tà Xùa.',
      duration: 'Khoảng 3 giờ (xuất phát 4:30 sáng)', meet: 'Sảnh Nhà của An', includes: ['Hướng dẫn viên dẫn đường', 'Nước suối', 'Đèn pin / áo ấm (mượn tại nhà)'], note: 'Mang áo khoác ấm và giày bám tốt. Nếu trời mưa lớn, tour được dời ngày, nhà sẽ báo trước.', details: 'Xuất phát khi trời còn tối để kịp đón biển mây và mặt trời mọc. Hướng dẫn viên đưa bạn tới điểm ngắm đẹp nhất trong ngày, chụp ảnh cùng bạn rồi cùng quay về ăn sáng nóng.' },
    { name: 'Chinh Phục Sống Lưng Khủng Long', price: 500000, image_url: 'images/ta-xua-wta-2026.jpg', description: 'Cung đường nổi tiếng với những dốc núi uốn lượn giữa biển mây.',
      duration: 'Nửa ngày (khoảng 5 giờ)', meet: 'Sảnh Nhà của An', includes: ['Hướng dẫn viên', 'Nước và đồ ăn nhẹ', 'Hỗ trợ chụp ảnh'], note: 'Cần sức khỏe tốt, đi giày thể thao, tránh đi khi mưa trơn.', details: 'Cung đường trekking quen thuộc của Tà Xùa với những đoạn sống núi uốn lượn giữa mây. Phù hợp nhóm bạn thích vận động và muốn có những tấm ảnh đẹp.' },
    { name: 'Rừng Chè Shan Tuyết Cổ Thụ', price: 350000, image_url: 'images/ruong-bac-thang.jpg', description: 'Dạo bước giữa những gốc chè cổ thụ trong không khí se lạnh của núi rừng.',
      duration: 'Khoảng 3 giờ', meet: 'Sảnh Nhà của An', includes: ['Hướng dẫn viên', 'Thưởng thức trà tại vườn'], note: 'Nên mang áo ấm, đi giày kín.', details: 'Dạo giữa những gốc chè Shan tuyết cổ thụ, nghe kể về nghề chè của người dân bản địa và nhâm nhi ly trà nóng ngay giữa rừng.' },
  ],
  // Dịch vụ & tiện ích. Giá tạm, chủ nhà sửa theo thực tế (price: 0 = Liên hệ báo giá). 
  // Khám phá Tà Xùa: mẹo săn mây + điểm tham quan (chủ nhà sửa/bổ sung theo thực tế).
  cloudTips: [
    { icon: '📅', title: 'Mùa đẹp nhất', text: 'Từ khoảng tháng 10 đến tháng 4 năm sau, là mùa mây dày và dễ gặp biển mây nhất.' },
    { icon: '🌅', title: 'Giờ nên dậy', text: 'Sáng sớm trước và quanh lúc mặt trời mọc. Nhà có tour Săn Mây Bình Minh xuất phát 4:30.' },
    { icon: '🧥', title: 'Chuẩn bị gì', text: 'Trời khoảng 15-22°C, sáng và tối khá lạnh. Mang áo ấm, áo mưa và giày chống trơn.' },
    { icon: '🌤️', title: 'Hỏi nhà trước', text: 'Mây phụ thuộc thời tiết từng ngày. Nhắn nhà để biết sáng mai có săn mây được không.' },
  ],
  attractions: [
    { name: 'Sống lưng khủng long Háng Đồng', tag: 'Săn mây · Trekking', image_url: 'images/ta-xua-wta-2026.jpg', text: 'Sống núi uốn lượn dài, nhìn ra các dãy núi, thung lũng và biển mây. Điểm nổi tiếng nhất Tà Xùa.' },
    { name: 'Đỉnh Gió', tag: 'Bình minh', image_url: 'images/vay-tay-bien-may.jpg', text: 'Nơi ngắm bình minh và săn mây, nhìn thấy nhiều lớp núi nối nhau. Có quán cà phê để ngồi ngắm.' },
    { name: 'Cây táo mèo cô đơn', tag: 'Check-in', emoji: '🌳', text: 'Một cây táo mèo đứng lẻ loi giữa đồi, trở thành biểu tượng được nhiều người tìm đến chụp ảnh.' },
    { name: 'Mỏm đá Đầu Rùa', tag: 'Ngắm cảnh', emoji: '🐢', text: 'Tảng đá nhô ra khỏi vách núi, hình dáng giống đầu rùa, đứng đó nhìn xuống biển mây.' },
    { name: 'Mỏm Cá Heo', tag: 'Ngắm cảnh', emoji: '🐬', text: 'Khối đá tự nhiên giống cá heo đang vươn lên giữa biển mây.' },
    { name: 'Thảo nguyên Tà Xùa', tag: 'Dã ngoại', emoji: '🌾', text: 'Triền cỏ rộng trên đường đến Mỏm Cá Heo và Cây cô đơn, hợp để chụp ảnh và dã ngoại.' },
    { name: 'Ngắm sao, săn dải Ngân Hà', tag: 'Tháng 3 - 10', emoji: '✨', text: 'Những đêm trời quang, ít ánh sáng, núi Tà Xùa có rất nhiều sao. Hợp vào mùa hè khi mây ít hơn. Nhà sẽ báo bạn đêm nào trời đẹp.' },
    { name: 'Cà phê ngắm view tại nhà', tag: 'Thư giãn', image_url: 'images/ban-ghe-ngam-may.jpg', text: 'Một ly cà phê nóng, một chiếc ghế gỗ và tầm nhìn mở ra thung lũng. Không cần đi đâu xa vẫn thấy mây.' },
    { name: 'Đồi chè cổ thụ', tag: 'Trải nghiệm', image_url: 'images/ruong-bac-thang.jpg', text: 'Những gốc chè hàng trăm năm tuổi giữa rừng, không khí se lạnh và yên tĩnh.' },
    { name: 'Rừng rêu', tag: 'Thiên nhiên', emoji: '🌿', text: 'Khu rừng thân cây phủ đầy rêu xanh, mát và yên, hợp để đi dạo chậm.' },
    { name: 'Ruộng bậc thang Xím Vàng', tag: 'Theo mùa', image_url: 'images/ruong-bac-thang.jpg', text: 'Được nhắc đến là một trong những nơi có ruộng bậc thang đẹp nhất khu vực. Đẹp nhất vào mùa lúa.' },
  ],
  attractionsNote: 'Thông tin mang tính tham khảo. Đường đi, thời tiết và tình trạng cung đường có thể thay đổi, hãy hỏi nhà trước khi đi.',
  // Mục Coffee (ngang hàng Homestay). Thiếu gì chủ nhà bổ sung ở đây; ô nào để trống thì web tự ẩn.
  coffee: {
    sub: 'Quán cà phê trên Đỉnh Gió',
    title: 'Nhà của An Coffee',
    tagline: 'Một ly cà phê nóng, một chiếc ghế gỗ và biển mây dưới chân bạn.',
    image_url: 'images/hoang-hon-quan-cafe.jpg',
    intro: [
      'Quán cà phê của Nhà của An nằm ở khu vực Đỉnh Gió, một trong những vị trí ngắm mây đẹp nhất Tà Xùa, nơi được mệnh danh là thiên đường săn mây của vùng cao.',
      'Quán làm bằng gỗ tự nhiên, mộc mạc, mở ra không gian khoáng đạt để bạn ngồi nhâm nhi và nhìn mây trôi giữa núi rừng.',
      'Bạn có thể ghé chỉ để uống cà phê, ngắm hoàng hôn, hoặc ở lại homestay cùng nơi để sáng hôm sau thức dậy ngay giữa biển mây.',
    ],
    highlights: [
      { icon: '☁️', title: 'Mây', text: 'Ngồi ngay tầm mây. Những ngày thuận lợi, biển mây phủ kín thung lũng ngay trước mắt.' },
      { icon: '🌄', title: 'Trải nghiệm', text: 'Cà phê buổi sáng trên mây, trà chiều ngắm hoàng hôn, bữa sáng nóng giữa trời mây.' },
      { icon: '🍃', title: 'Chill', text: 'Ghế gỗ, ban công mở, không ai giục. Hợp để ngồi cả buổi và chậm lại.' },
      { icon: '💬', title: 'Khách kể lại', text: 'Khách khen phòng và quán view đẹp, dễ săn mây, nhân viên nhiệt tình, giá hợp lý.' },
    ],
    facts: [
      { icon: '📍', label: 'Khu vực', value: 'Đỉnh Gió, Tà Xùa' },
      { icon: '☁️', label: 'View săn mây', value: 'Có' },
      { icon: '🕒', label: 'Giờ mở cửa', value: '7:00 - 21:00' },
      { icon: '☕', label: 'Đồ uống từ', value: '30.000 đ / ly' },
      { icon: '🅿️', label: 'Chỗ đỗ xe', value: 'Có' },
    ],
    // ĂN UỐNG tại Nhà của An (nhà hàng). Chủ nhà tự điền: thêm dòng vào `items` của từng nhóm, bỏ dấu // ở đầu dòng mẫu.
    // price: số tiền (ví dụ 65000); price: 0 = hiện "Liên hệ". image_url: 'images/ten-anh.jpg' (không bắt buộc). Nhóm chưa có món thì web tự ẩn.
    dining: [
      { title: 'Bữa sáng', note: '', items: [
        // { name: 'Tên món', price: 0, desc: 'Mô tả ngắn', image_url: '' },
      ] },
      { title: 'Món chính', note: '', items: [
        // { name: 'Tên món', price: 0, desc: 'Mô tả ngắn', image_url: '' },
      ] },
      { title: 'Đồ uống', note: '', items: [
        // { name: 'Tên món', price: 0, desc: 'Mô tả ngắn', image_url: '' },
      ] },
    ],
    diningNote: '',
    menuFrom: ['Cà phê & đồ uống', 'Trà chiều ngắm hoàng hôn', 'Bữa sáng trên mây'],
    goods: ['Vị trí đẹp ngay Đỉnh Gió', 'Không khí thư thái, chữa lành', 'Khách ở nhà được giảm khi gọi đồ uống'],
    notes: ['Trải nghiệm phụ thuộc thời tiết, mây không có mỗi ngày. Nhắn nhà để biết tình hình trước khi lên.'],
    photos: [
      'images/tram-mam-xoi.jpg', 'images/ban-ghe-ngam-may.jpg', 'images/hoang-hon-quan-cafe.jpg',
      'images/bua-sang-tren-may.jpg', 'images/ngam-bien-may.jpg', 'images/hoang-hon-fisheye.jpg',
    ],
    guestPhotos: [
      { image_url: 'images/bang-hay-lay-toi-di.jpg', caption: 'Bữa sáng "Hãy lấy tôi đi"' },
      { image_url: 'images/hay-lay-toi-di-cabin.jpg', caption: 'Góc check-in ở nhà gỗ' },
      { image_url: 'images/vay-tay-bien-may.jpg', caption: 'Chào buổi sáng trên mây' },
      { image_url: 'images/den-long-hoang-hon.jpg', caption: 'Đèn lồng lên đèn trên biển mây' },
    ],
  },
  catalogIsSample: false,
  services: [
    { icon: '🍵', name: 'Trà chiều ngắm hoàng hôn', price: 120000, unit: '/ người', image_url: 'images/hoang-hon-quan-cafe.jpg', time: '16:00 - 18:00 hằng ngày', description: 'Ấm trà nóng cùng bánh nhỏ, ngồi ngắm hoàng hôn trên biển mây.', includes: ['Ấm trà nóng theo mùa', 'Bánh / hạt nhỏ ăn kèm', 'Chỗ ngồi view hoàng hôn'], note: 'Nên đến sớm 15 phút để chọn chỗ đẹp. Nhắn nhà để giữ chỗ cho nhóm đông.' },
    { icon: '🍜', name: 'Bữa sáng trên mây', price: 80000, unit: '/ người', image_url: 'images/bua-sang-tren-may.jpg', time: '7:00 - 9:30', description: 'Tô mì thập cẩm nóng hổi kèm đồ uống, ăn giữa trời mây.', includes: ['Mì thập cẩm', 'Cà phê hoặc trà nóng'], note: 'Khách nghỉ tại nhà có thể đặt kèm khi đặt phòng hoặc nhắn nhà.' },
    { icon: '☕', name: 'Cà phê & đồ uống', price: 30000, unit: 'từ / ly', image_url: 'images/ban-ghe-ngam-may.jpg', time: '7:00 - 21:00', description: 'Góc cà phê ngắm núi rừng ngay tại nhà, có chỗ ngồi ngoài trời.', includes: ['Cà phê, trà, nước ép', 'Chỗ ngồi ngoài trời ngắm mây'], note: 'Khách ở nhà được giảm khi gọi đồ uống tại quán.' },
    { icon: '🛵', name: 'Thuê xe máy', price: 150000, unit: '/ ngày', time: 'Theo nhu cầu', description: 'Có xe máy cho thuê để di chuyển quanh Tà Xùa và khu trung tâm.', includes: ['Xe máy số/tay ga', 'Mũ bảo hiểm'], note: 'Cần giấy tờ tùy thân khi nhận xe. Nhắn nhà để giữ xe trước.' },
    { icon: '🎒', name: 'Hỗ trợ hành lý & đưa đón', price: 0, unit: '', time: 'Báo trước khi đến', description: 'Nhà đi bộ lên hơi dốc, nhân viên hỗ trợ mang hành lý lên xuống và tư vấn xe di chuyển.', includes: ['Mang hành lý lên xuống', 'Tư vấn xe khứ hồi'], note: 'Báo giờ đến để nhà chuẩn bị. Chi phí đưa đón nhà sẽ báo khi bạn nhắn.' },
    { icon: '🧭', name: 'Tư vấn lịch trình', price: 0, unit: '', time: 'Miễn phí', description: 'Gợi ý thời điểm, điểm săn mây và lịch trình 2 ngày 1 đêm, 3 ngày 2 đêm.', includes: ['Gợi ý theo mùa và thời tiết', 'Combo phòng, ăn sáng, xe khứ hồi (nhắn nhà để biết giá)'], note: 'Nhắn Messenger bất cứ lúc nào, nhà hỗ trợ 24/7.' },
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
  // Câu chuyện chủ nhà (chờ chủ nhà gửi bản thật).
  story: [
    'Nhà của An bắt đầu từ một mong muốn giản dị: có một góc nhỏ trên Tà Xùa để khách dừng chân, uống ly cà phê nóng và nhìn mây trôi dưới chân mình.',
    'Chúng tôi giữ nhà thật mộc, thật ấm, để mỗi vị khách đến đây được nghỉ ngơi chậm lại giữa núi rừng Tây Bắc.',
  ],
  storySign: '— Chủ nhà An',
  storyIsSample: false,
  // Chính sách hoàn/hủy (chờ chủ nhà xác nhận bản thật). Hiện ở trang chính sách, FAQ và trang đơn.
  policyIsSample: false,
  cancelPolicy: [
    'Hủy trước ngày nhận phòng từ 7 ngày: hoàn 100% tiền đã chuyển.',
    'Hủy từ 3 đến 6 ngày trước ngày nhận phòng: hoàn 50%.',
    'Hủy dưới 3 ngày hoặc không đến: không hoàn tiền.',
    'Đổi ngày: báo trước ít nhất 3 ngày, tùy tình trạng phòng.',
    'Thời tiết xấu, đường bị chặn khiến không thể lên Tà Xùa: nhà hỗ trợ đổi ngày hoặc hoàn tiền, báo cho nhà qua Messenger.',
  ],
  faq: [
    { question: 'Chính sách hoàn / hủy phòng thế nào?', answer: 'Hủy trước 7 ngày hoàn 100%, từ 3 đến 6 ngày hoàn 50%, dưới 3 ngày không hoàn. Xem chi tiết ở trang Chính sách. Nếu thời tiết xấu khiến bạn không lên được, hãy nhắn nhà để được hỗ trợ.' },
    { question: 'Làm sao để đặt phòng?', answer: 'Bạn bấm "Đặt Phòng" và điền thông tin, hoặc nhắn trực tiếp qua Facebook của nhà. Nhà sẽ liên hệ xác nhận với bạn.' },
    { question: 'Giờ nhận và trả phòng như thế nào?', answer: 'Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần đến sớm hoặc gửi hành lý, hãy báo trước cho nhà.' },
    { question: 'Thời điểm nào săn mây đẹp nhất?', answer: 'Mùa săn mây ở Tà Xùa thường từ cuối tháng 9 đến tháng 4 năm sau. Thời tiết thay đổi theo ngày nên nhà sẽ tư vấn thêm khi bạn liên hệ.' },
    { question: 'Nhà có hỗ trợ tư vấn lịch trình không?', answer: 'Có. Bạn nhắn cho nhà thời gian dự định đến, nhà sẽ gợi ý lịch trình săn mây và các điểm tham quan gần đó.' },
  ],
};
