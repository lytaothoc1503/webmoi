-- Nạp dữ liệu ban đầu từ data.js (chỉ chạy khi bảng còn trống)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM rooms) THEN INSERT INTO rooms(name,price,image_url,perks,description,sort_order,guests,bed,view) VALUES
  ('Phòng Đôi Gỗ View Thung Lũng',850000,'images/phong-view-may.jpg',ARRAY['Không gian gỗ ấm cúng','Ngắm mây từ khung cửa','Chăn đệm ấm cho đêm núi']::text[],NULL,1,'2 khách','1 giường đôi','View thung lũng, biển mây'),
  ('Phòng Gia Đình',1600000,'images/hay-lay-toi-di-cabin.jpg',ARRAY['Phù hợp nhóm nhỏ, gia đình','Không gian rộng rãi','Gần khu ngắm mây']::text[],NULL,2,'4 khách','2 giường đôi','View núi rừng'),
  ('Giường Tập Thể (Dorm)',250000,'images/bap-treo-cua-so.jpg',ARRAY['Phù hợp nhóm bạn','Tiết kiệm chi phí','Không gian chung vui vẻ']::text[],NULL,3,'1 khách / giường','Giường tầng','Không gian chung');
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM tours) THEN INSERT INTO tours(name,price,image_url,description,sort_order,duration,meet,includes,note,details) VALUES
  ('Săn Mây Bình Minh',300000,'images/vay-tay-bien-may.jpg','Dậy sớm đón biển mây và ánh bình minh trên đỉnh núi Tà Xùa.',1,'Khoảng 3 giờ (xuất phát 4:30 sáng)','Sảnh Nhà của An',ARRAY['Hướng dẫn viên dẫn đường','Nước suối','Đèn pin / áo ấm (mượn tại nhà)']::text[],'Mang áo khoác ấm và giày bám tốt. Nếu trời mưa lớn, tour được dời ngày, nhà sẽ báo trước.','Xuất phát khi trời còn tối để kịp đón biển mây và mặt trời mọc. Hướng dẫn viên đưa bạn tới điểm ngắm đẹp nhất trong ngày, chụp ảnh cùng bạn rồi cùng quay về ăn sáng nóng.'),
  ('Chinh Phục Sống Lưng Khủng Long',500000,'images/ta-xua-wta-2026.jpg','Cung đường nổi tiếng với những dốc núi uốn lượn giữa biển mây.',2,'Nửa ngày (khoảng 5 giờ)','Sảnh Nhà của An',ARRAY['Hướng dẫn viên','Nước và đồ ăn nhẹ','Hỗ trợ chụp ảnh']::text[],'Cần sức khỏe tốt, đi giày thể thao, tránh đi khi mưa trơn.','Cung đường trekking quen thuộc của Tà Xùa với những đoạn sống núi uốn lượn giữa mây. Phù hợp nhóm bạn thích vận động và muốn có những tấm ảnh đẹp.'),
  ('Rừng Chè Shan Tuyết Cổ Thụ',350000,'images/ruong-bac-thang.jpg','Dạo bước giữa những gốc chè cổ thụ trong không khí se lạnh của núi rừng.',3,'Khoảng 3 giờ','Sảnh Nhà của An',ARRAY['Hướng dẫn viên','Thưởng thức trà tại vườn']::text[],'Nên mang áo ấm, đi giày kín.','Dạo giữa những gốc chè Shan tuyết cổ thụ, nghe kể về nghề chè của người dân bản địa và nhâm nhi ly trà nóng ngay giữa rừng.');
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM services) THEN INSERT INTO services(name,icon,price,unit,image_url,time,description,includes,note,sort_order) VALUES
  ('Trà chiều ngắm hoàng hôn','🍵',120000,'/ người','images/hoang-hon-quan-cafe.jpg','16:00 - 18:00 hằng ngày','Ấm trà nóng cùng bánh nhỏ, ngồi ngắm hoàng hôn trên biển mây.',ARRAY['Ấm trà nóng theo mùa','Bánh / hạt nhỏ ăn kèm','Chỗ ngồi view hoàng hôn']::text[],'Nên đến sớm 15 phút để chọn chỗ đẹp. Nhắn nhà để giữ chỗ cho nhóm đông.',1),
  ('Bữa sáng trên mây','🍜',80000,'/ người','images/bua-sang-tren-may.jpg','7:00 - 9:30','Tô mì thập cẩm nóng hổi kèm đồ uống, ăn giữa trời mây.',ARRAY['Mì thập cẩm','Cà phê hoặc trà nóng']::text[],'Khách nghỉ tại nhà có thể đặt kèm khi đặt phòng hoặc nhắn nhà.',2),
  ('Cà phê & đồ uống','☕',30000,'từ / ly','images/ban-ghe-ngam-may.jpg','7:00 - 21:00','Góc cà phê ngắm núi rừng ngay tại nhà, có chỗ ngồi ngoài trời.',ARRAY['Cà phê, trà, nước ép','Chỗ ngồi ngoài trời ngắm mây']::text[],'Khách ở nhà được giảm khi gọi đồ uống tại quán.',3),
  ('Thuê xe máy','🛵',150000,'/ ngày',NULL,'Theo nhu cầu','Có xe máy cho thuê để di chuyển quanh Tà Xùa và khu trung tâm.',ARRAY['Xe máy số/tay ga','Mũ bảo hiểm']::text[],'Cần giấy tờ tùy thân khi nhận xe. Nhắn nhà để giữ xe trước.',4),
  ('Hỗ trợ hành lý & đưa đón','🎒',0,'',NULL,'Báo trước khi đến','Nhà đi bộ lên hơi dốc, nhân viên hỗ trợ mang hành lý lên xuống và tư vấn xe di chuyển.',ARRAY['Mang hành lý lên xuống','Tư vấn xe khứ hồi']::text[],'Báo giờ đến để nhà chuẩn bị. Chi phí đưa đón nhà sẽ báo khi bạn nhắn.',5),
  ('Tư vấn lịch trình','🧭',0,'',NULL,'Miễn phí','Gợi ý thời điểm, điểm săn mây và lịch trình 2 ngày 1 đêm, 3 ngày 2 đêm.',ARRAY['Gợi ý theo mùa và thời tiết','Combo phòng, ăn sáng, xe khứ hồi (nhắn nhà để biết giá)']::text[],'Nhắn Messenger bất cứ lúc nào, nhà hỗ trợ 24/7.',6);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM gallery) THEN INSERT INTO gallery(image_url,caption,sort_order) VALUES
  ('images/hero-san-may.jpg','Biển mây Tà Xùa',1),
  ('images/hoang-hon-fisheye.jpg','Hoàng hôn rực lửa',2),
  ('images/tram-mam-xoi.jpg','Trạm Mầm Xôi cà phê',3),
  ('images/ruong-bac-thang.jpg','Ruộng bậc thang mùa chín',4),
  ('images/bap-treo-cua-so.jpg','Bắp treo bên khung cửa',5),
  ('images/bang-hay-lay-toi-di.jpg','Bữa sáng "Hãy lấy tôi đi"',6),
  ('images/hay-lay-toi-di-cabin.jpg','Góc check-in ở nhà gỗ',7),
  ('images/den-long-hoang-hon.jpg','Đèn lồng lên đèn trên biển mây',8),
  ('images/phong-view-may.jpg','Giường cạnh khung cửa ngắm mây',9),
  ('images/nha-go-den-long.jpg','Nhà gỗ giữa đồi xanh',10),
  ('images/ngam-bien-may.jpg','Nằm trong phòng ngắm biển mây',11),
  ('images/ban-ghe-ngam-may.jpg','Góc ban công ngắm mây',12),
  ('images/hoang-hon-quan-cafe.jpg','Hoàng hôn từ quán cà phê',13),
  ('images/bac-da-nha-go.jpg','Bậc đá dẫn lối đến nhà gỗ',14),
  ('images/vay-tay-bien-may.jpg','Chào buổi sáng trên mây',15),
  ('images/bua-sang-tren-may.jpg','Bữa sáng nóng giữa trời mây',16);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM faq) THEN INSERT INTO faq(question,answer,sort_order) VALUES
  ('Chính sách hoàn / hủy phòng thế nào?','Hủy trước 7 ngày hoàn 100%, từ 3 đến 6 ngày hoàn 50%, dưới 3 ngày không hoàn. Xem chi tiết ở trang Chính sách. Nếu thời tiết xấu khiến bạn không lên được, hãy nhắn nhà để được hỗ trợ.',1),
  ('Làm sao để đặt phòng?','Bạn bấm "Đặt Phòng" và điền thông tin, hoặc nhắn trực tiếp qua Facebook của nhà. Nhà sẽ liên hệ xác nhận với bạn.',2),
  ('Giờ nhận và trả phòng như thế nào?','Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần đến sớm hoặc gửi hành lý, hãy báo trước cho nhà.',3),
  ('Thời điểm nào săn mây đẹp nhất?','Mùa săn mây ở Tà Xùa thường từ cuối tháng 9 đến tháng 4 năm sau. Thời tiết thay đổi theo ngày nên nhà sẽ tư vấn thêm khi bạn liên hệ.',4),
  ('Nhà có hỗ trợ tư vấn lịch trình không?','Có. Bạn nhắn cho nhà thời gian dự định đến, nhà sẽ gợi ý lịch trình săn mây và các điểm tham quan gần đó.',5);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM reviews) THEN INSERT INTO reviews(author_name,author_avatar,rating,content,sort_order) VALUES
  ('Thu Vu',NULL,5,'Phòng ốc sạch sẽ, ấm cúng. Mình lên thời điểm 20-22/8/25 thời tiết đẹp, sáng sớm mưa lất phất, tầm 9h sáng trở đi mây phủ giăng khắp cả ngọn đồi trông rất chill. Dù vậy nhiệt độ chỉ tầm 19-20° nên rất đã. Các bạn nhân viên nhiệt tình dễ thương. Dù đi bộ lên khá mệt nhưng suy nghĩ như đi tập thể dục thì cũng vui. Đừng lo về hành lí vì đã có các bạn nhân viên hỗ trợ mang lên xuống.',1),
  ('Vy Anh Trần',NULL,5,'Chị chủ nhiệt tình, dễ thương. Nhân viên phục vụ chu đáo nhiệt tình. Phòng và cafe view đẹppp, dễ săn mây, giá cả hợp lí. Đặt combo 3n2d bao gồm ăn sáng (mì thập cẩm), phòng và xe khứ hồi 1tr2 + mua nước ở cafe đc giảm 15% và home cũng có dv cho thuê xe máy nên rất tiện, gần trung tâm. Phòng mình ở là An 9, giường ở 3 người vẫn rộng rãi thoải mái. Mỗi tội từ phòng leo lên mệt muốn đứt hơi.',2);
END IF; END $$;
