# Hướng dẫn sửa web nhanh (dành cho chủ nhà)

Mọi nội dung nằm ở **`data.js`** (giá, mô tả, món ăn, ảnh). Liên hệ và ngân hàng nằm ở **`config.js`**.
Sửa xong và lưu lên GitHub thì sau 1-3 phút web tự cập nhật.

## Trước khi sửa
Trên VS Code gõ (PowerShell): `git pull --rebase`. Trên điện thoại (github.dev) cũng làm bước này trước khi sửa.

## Việc hay làm
| Muốn làm | Sửa ở đâu |
| --- | --- |
| Đổi giá phòng | `data.js`, mục `rooms`, ô `price` (số tiền, ví dụ `850000`) |
| Đổi giá tour hoặc dịch vụ | `data.js`, mục `tours` hoặc `services`, ô `price` (`0` = hiện "Liên hệ") |
| Thêm món ăn, đồ uống | `data.js`, mục `dining` (có dòng mẫu, bỏ dấu `//` rồi sửa tên và giá) |
| Thêm ảnh | Bỏ ảnh vào thư mục `images/`, rồi ghi `'images/ten-anh.jpg'` ở ô `image_url` |
| Thêm ảnh khách hàng | `data.js`, mục `coffee`, ô `guestPhotos` |
| Đổi giờ mở cửa, thông tin quán | `data.js`, mục `coffee`, ô `facts` |
| Điền tài khoản ngân hàng (hiện mã QR) | `config.js`, mục `bank`, điền đủ 4 ô |
| Điền email nhận đơn | `config.js`, ô `email` trong `contacts` |

## Lưu ý để web không lỗi
- Giữ nguyên dấu nháy `'`, dấu phẩy `,` ở cuối mỗi dòng và các ngoặc `{ }` `[ ]`.
- Số tiền viết liền, không có dấu chấm: `850000`, không viết `850.000`.
- Không ghi mật khẩu hay khóa bí mật vào file nào.
- Không hiện ngày "cập nhật" lên web.
- Sau khi lưu, tab **Actions** trên GitHub báo xanh là ổn. Báo đỏ thì nhắn lại, sẽ có người sửa giúp.
