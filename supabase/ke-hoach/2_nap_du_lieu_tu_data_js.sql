-- Nạp dữ liệu ban đầu từ data.js (chỉ chạy khi bảng còn trống)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms) THEN
    INSERT INTO rooms(name, price, image_url, perks, description, sort_order, guests, bed, view)
    VALUES
      ('Phòng Đôi Gỗ View Thung Lũng', 850000, 'images/phong-view-may.jpg', ARRAY['Không gian gỗ ấm cúng','Ngắm mây từ khung cửa','Chăn đệm ấm cho đêm núi']::text[], NULL, 1, '2 khách', '1 giường đôi', 'View thung lũng, biển mây'),
      ('Phòng Gia Đình', 1600000, 'images/hay-lay-toi-di-cabin.jpg', ARRAY['Phù hợp nhóm nhỏ, gia đình','Không gian rộng rãi','Gần khu ngắm mây']::text[], NULL, 2, '4 khách', '2 giường đôi', 'View núi rừng'),
      ('Giường Tập Thể (Dorm)', 250000, 'images/bap-treo-cua-so.jpg', ARRAY['Phù hợp nhóm bạn','Tiết kiệm chi phí','Không gian chung vui vẻ']::text[], NULL, 3, '1 khách / giường', 'Giường tầng', 'Không gian chung');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tours) THEN
    INSERT INTO tours(name, price, image_url, description, sort_order, duration, meet, includes, note, details)
    VALUES
      ('Săn Mây Bình Minh', 300000, 'images/vay-tay-bien-may.jpg', 'Dậy sớm đón biển mây và ánh bình minh trên đỉnh núi Tà Xùa.', 1, 'Khoảng 3 giờ (xuất phát 4:30 sáng)', 'Sảnh Nhà của An', ARRAY['Hướng dẫn viên dẫn đường','Nước suối','Đèn pin / áo ấm (mượn tại nhà)']::text[], 'Nên mang giày trekking, áo ấm và camera.', 'Điểm săn mây tuyệt vời từ đỉnh Tà Xùa'),
      ('Chinh Phục Sống Lưng Khủng Long', 500000, 'images/ta-xua-wta-2026.jpg', 'Cung đường nổi tiếng với những dốc núi uốn lượn giữa biển mây.', 2, 'Nửa ngày (khoảng 5 giờ)', 'Sảnh Nhà của An', ARRAY['Hướng dẫn viên','Nước và đồ ăn nhẹ','Hỗ trợ chụp ảnh']::text[], 'Cần sức khỏe tốt, đi từng bước chậm chạp.', 'Con đường uốn lượn nổi tiếng giữa núi rừng'),
      ('Rừng Chè Shan Tuyết Cổ Thụ', 350000, 'images/ruong-bac-thang.jpg', 'Dạo bước giữa những gốc chè cổ thụ trong không khí se lạnh của núi rừng.', 3, 'Khoảng 3 giờ', 'Sảnh Nhà của An', ARRAY['Hướng dẫn viên','Thưởng thức trà tại vườn']::text[], 'Nên mang áo ấm, đi giày kín.', 'Thưởng trà cổ thụ với view núi tuyệt đẹp');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services) THEN
    INSERT INTO services(name, icon, price, unit, image_url, time, description, includes, note, sort_order, is_active)
    VALUES
      ('Trà chiều ngắm hoàng hôn', '🍵', 120000, '/ người', 'images/hoang-hon-quan-cafe.jpg', '16:00 - 18:00 hằng ngày', 'Ấm trà nóng cùng bánh nhỏ, ngồi ngắm hoàng hôn trên biển mây.', ARRAY['Trà ấm','Bánh nhỏ']::text[], 'Đặt trước để không hết chỗ.', 1, true),
      ('Bữa sáng trên mây', '🍜', 80000, '/ người', 'images/bua-sang-tren-may.jpg', '7:00 - 9:30', 'Tô mì thập cẩm nóng hổi kèm đồ uống, ăn giữa trời mây.', ARRAY['Mì thập cẩm','Đồ uống']::text[], 'Nên đặt hôm trước.', 2, true),
      ('Cà phê & đồ uống', '☕', 30000, 'từ / ly', 'images/ban-ghe-ngam-may.jpg', '7:00 - 21:00', 'Góc cà phê ngắm núi rừng ngay tại nhà, có chỗ ngồi ngoài trời.', ARRAY['Cà phê','Trà','Nước ấm']::text[], 'Có wifi, sạch sẽ.', 3, true),
      ('Thuê xe máy', '🛵', 150000, '/ ngày', NULL, 'Theo nhu cầu', 'Có xe máy cho thuê để di chuyển quanh Tà Xùa và khu trung tâm.', ARRAY['Xe máy số/tay ga','Mũ bảo hiểm']::text[], 'Cần bằng lái, giấy tờ tùy thân.', 4, true),
      ('Hỗ trợ hành lý & đưa đón', '🎒', 0, '', NULL, 'Báo trước khi đến', 'Nhà đi bộ lên hơi dốc, nhân viên hỗ trợ mang hành lý lên xuống và tư vấn xe di chuyển.', ARRAY['Mang hành lý','Tư vấn đi lại']::text[], 'Miễn phí.', 5, true),
      ('Tư vấn lịch trình', '🧭', 0, '', NULL, 'Miễn phí', 'Gợi ý thời điểm, điểm săn mây và lịch trình 2 ngày 1 đêm, 3 ngày 2 đêm.', ARRAY['Lịch trình tư vấn','Gợi ý theo mùa']::text[], 'Miễn phí.', 6, true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM gallery) THEN
    INSERT INTO gallery(image_url, caption, sort_order, is_active)
    VALUES
      ('images/hero-san-may.jpg', 'Biển mây Tà Xùa', 1, true),
      ('images/hoang-hon-fisheye.jpg', 'Hoàng hôn rực lửa', 2, true),
      ('images/tram-mam-xoi.jpg', 'Trạm Mầm Xôi cà phê', 3, true),
      ('images/ruong-bac-thang.jpg', 'Ruộng bậc thang mùa chín', 4, true),
      ('images/bap-treo-cua-so.jpg', 'Bắp treo bên khung cửa', 5, true),
      ('images/bang-hay-lay-toi-di.jpg', 'Bữa sáng "Hãy lấy tôi đi"', 6, true),
      ('images/hay-lay-toi-di-cabin.jpg', 'Góc check-in ở nhà gỗ', 7, true),
      ('images/den-long-hoang-hon.jpg', 'Đèn lồng lên đèn trên biển mây', 8, true),
      ('images/phong-view-may.jpg', 'Giường cạnh khung cửa ngắm mây', 9, true),
      ('images/nha-go-den-long.jpg', 'Nhà gỗ giữa đồi xanh', 10, true),
      ('images/ngam-bien-may.jpg', 'Nằm trong phòng ngắm biển mây', 11, true),
      ('images/ban-ghe-ngam-may.jpg', 'Góc ban công ngắm mây', 12, true),
      ('images/hoang-hon-quan-cafe.jpg', 'Hoàng hôn từ quán cà phê', 13, true),
      ('images/bac-da-nha-go.jpg', 'Bậc đá dẫn lối đến nhà gỗ', 14, true),
      ('images/vay-tay-bien-may.jpg', 'Chào buổi sáng trên mây', 15, true),
      ('images/bua-sang-tren-may.jpg', 'Bữa sáng nóng giữa trời mây', 16, true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM faq) THEN
    INSERT INTO faq(question, answer, sort_order, is_active)
    VALUES
      ('Chính sách hoàn / hủy phòng thế nào?', 'Hủy trước 7 ngày hoàn 100%, từ 3 đến 6 ngày hoàn 50%, dưới 3 ngày không hoàn. Xem chi tiết ở trang Chính sách. Nếu thời tiết xấu hoặc đường bị chặn, liên hệ nhà để đổi ngày.', 1, true),
      ('Làm sao để đặt phòng?', 'Bạn bấm "Đặt Phòng" và điền thông tin, hoặc nhắn trực tiếp qua Facebook của nhà. Nhà sẽ liên hệ xác nhận với bạn.', 2, true),
      ('Giờ nhận và trả phòng như thế nào?', 'Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần đến sớm hoặc gửi hành lý, hãy báo trước cho nhà.', 3, true),
      ('Thời điểm nào săn mây đẹp nhất?', 'Mùa săn mây ở Tà Xùa thường từ cuối tháng 9 đến tháng 4 năm sau. Thời tiết thay đổi theo ngày nên nhà sẽ tư vấn thời điểm tốt nhất.', 4, true),
      ('Nhà có hỗ trợ tư vấn lịch trình không?', 'Có. Bạn nhắn cho nhà thời gian dự định đến, nhà sẽ gợi ý lịch trình săn mây và các điểm tham quan gần đó.', 5, true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM reviews) THEN
    INSERT INTO reviews(author_name, author_avatar, rating, content, is_published, sort_order)
    VALUES
      ('Thu Vu', NULL, 5, 'Phòng ốc sạch sẽ, ấm cúng. Mình lên thời điểm 20-22/8/25 thời tiết đẹp, sáng sớm mưa lất phất, tầm 9h sáng trở đi mây phủ giăng khắp nơi. Quá tuyệt vời!', true, 1),
      ('Vy Anh Trần', NULL, 5, 'Chị chủ nhiệt tình, dễ thương. Nhân viên phục vụ chu đáo, phòng và cafe view đẹp, dễ săn mây, giá cả hợp lí. Đặt combo nhiều lần rồi, sẽ còn quay lại.', true, 2);
  END IF;
END $$;
