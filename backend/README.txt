npm i cors dotenv express jsonwebtoken multer nodemon stripe validator brcypt cloudinary mysql2
npm install express mysql2 redis amqplib
npm install --save-dev nodemon


-- trong dockerfile sẽ 2 phần, 1 phần là chạy để test, 1 phần là chạy để build production
---- lệnh chạy DEV: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build (chỉ build khi có thư viện mới, ...)
---- lệnh chạy PROD: docker-compose -f docker-compose.yml up --build -d (bỏ -d để thấy terminal đang chạy)

-- chạy code ở folder backend
root
-- lệnh kiểm tra bảng csdl
----- docker exec -it mysql_container mysql -u root -p mydb(thay mydb thành db mà service đang sử dụng)
----- USE user_db;
----- SHOW TABLES;
----- SELECT * FROM users;

-- lệnh kiểm tra redis
---- docker exec -it ( thay bằn id của redis trong docker) redis-cli
---- keys * để xem các key


-- lệnh log 1 service nào đó
----- docker-compose logs -f product-service

-- lệnh THÊM ADMIN ĐẦU TIÊN
docker exec -it id-container-user sh => node src/seedAdmin.js

-- Khi cài thư viện mới cần build lại với --no-cache

-- xem lấy đúng biến môi trường chưa
docker exec -it <container_id> env | grep GOOGLE_CLIENT_SECRET


-- DEMO 1 triệu người cùng mua 1 sản phẩm, tắt 1 service thì service khác vẫn hoạt động bình thường(xem trong chat gpt)

Client secret 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
Client ID 852218064853-7aog4t8ibs7gfio6rs4vs3fo1ve5jqlg.apps.googleusercontent.com

Trong e-commerce, quan trọng nhất là tính nhất quán dữ liệu (đơn hàng – thanh toán – tồn kho) và khả năng chịu tải cao khi traffic đột biến (sale, flash sale).

product-service gọi sang categoryService bằng rabbitMQ

-user-service 
-- Client
đăng kí (xong)
đăng nhập (xong)
refreshToken (xong)
logout (xong)
quên mật khẩu (xong)
lấy thông tin cá nhân (xong)
-- admin
lấy danh sách người dùng(xong)

-product-service
thêm sản phẩm(xong)
sửa sản phẩm(xong)
xóa sản phẩm(xong)
danh sách sản phẩm(xong)
chi tiết sản phẩm

-category-service
thêm danh mục(xong)
sửa danh mục(xong)
xóa danh mục(xong)
danh sách danh mục(xong)


nhớ là trang update sản phẩm (gọi api lấy chi tiết sản phẩm, ấn LƯU thì gọi api update) không
cập nhật tồn kho ở trang này, sẽ có 1 trang riêng để cập nhật tồn kho(ở trang này không
cập nhật tên, price,...)



-- khi đến đoạn gửi mail thì cần nhớ 
🧩 1. Cấu trúc message gửi vào queue

Khi một service khác (ví dụ order-service hay user-service) muốn gửi mail,
nó chỉ cần gửi message có dạng chung này:

{
  type: "forgot_password", // hoặc "order_success", "order_cancel"
  to: "user@gmail.com",
  subject: "Đặt lại mật khẩu",
  html: "<p>Nhấn vào link này để đặt lại mật khẩu...</p>"
}
Ví dụ cụ thể trong từng trường hợp:

🔹 Quên mật khẩu
await channel.sendToQueue("email_queue", Buffer.from(JSON.stringify({
  type: "forgot_password",
  to: user.email,
  subject: "Quên mật khẩu",
  html: `<p>Bấm vào link này để đặt lại mật khẩu: ${resetLink}</p>`
})));


khi người dùng đặt hàng -> redis trừ tồn kho(<0 thì báo hết hàng) => khi redis xác nhận còn hàng
=> đưa message vào queue rabbit => xử lí dần  => order-service lắng nghe order_queue
=> cập nhật DB => và gửi mail cho khách
🧩 Tóm tắt flow cuối cùng (chuẩn nhất để demo flash sale):
graph TD
A[User click Mua ngay] --> B[API Gateway / Order Controller]
B --> C[Redis check stock]
C -->|Còn hàng| D[Push vào RabbitMQ: order_queue]
C -->|Hết hàng| H[Socket emit 'fail']

D --> E[OrderService consumer xử lý đơn hàng]
E -->|OK| F[Emit socket 'success']
E -->|OK| G[Publish 'order.created' → email_queue]
E -->|Fail| H[Emit socket 'fail']

G --> I[NotificationService consumer gửi mail xác nhận]


-- KHI NÀO LÀM ĐẾN ĐOẠN ORDER_SUCCESS THÌ XEM FILE NOTIFICATION.CONSUMER.JS

-----------------------------------------------------------------RABBITMQ--------------------------------------------------------------------------------
- Hiện tại bên categoryService đang publish sự kiện thêm, xóa danh mục sang bên product(product đang nhận)
- bên user-service đang publish sự kiện gửi mail sang cho NotificationService (đang có sẵn mail order_success)
- bên product đang publish sự kiện thêm sản phẩm mới sang bên inventory để tạo redis và stock = 0

tức là khi thêm sản phẩm thì product publish sang inventory
còn khi lấy sản phẩm thì product gọi sang inventory để lấy thông tin tồn kho(có thể thêm redis như bên category)

---Trang quản lý tồn kho (Inventory Management)
Xem danh sách tồn kho từng sản phẩm
Cập nhật số lượng (stock)
Có thể tìm theo productName hoặc size
Không sửa giá, tên, hay mô tả sản phẩm

khi thêm sản phẩm + size => publish sự kiện sang inventory => inventory cache(khi thay đổi tồn kho cũng sẽ cache lại)
khi thêm sản phẩm mới thì chỉ publish sang inventory để stock của size đó bằng 0, phải có 1 trang để


-- Nếu tách 2 trang:
1.Sửa sản phẩm(chỉ sửa tên, giá, ...) thì trang này vào sẽ gọi api lấy chi tiết 1 sản phẩm, khi lưu thì gọi api update sản phẩm
2.Trang sửa tồn kho(chỉ sửa tồn kho) thì trang này sẽ gọi api lấy chi tiết sản phẩm có chứa stock(mà bên inventory không có id sản phẩm
thì sẽ không lấy ra được các tồn kho của các size của sản phẩm đó để hiển thị => phải gọi gộp) nhưng bên inventory đang
thiết kế api kiểu sẽ gọi trang riêng

bên product đang gọi category
cache danh sách sản phẩm bên inventory(nếu bên product có thêm, sửa, xóa thì cũng cần cache lại danh sách)
2 cache stock và cache danh sách sản phẩm là khác nhau(hình như đang cùng event gửi sang, chieeuf xem)

xem đoạn chatgpt tách service inventory

ĐỌC
Lý do:
Tiêu chí	Giải thích
✅ Loose coupling (giảm phụ thuộc)	Inventory không gọi trực tiếp Product, mà chỉ nghe event. Nếu Product chết → Inventory vẫn chạy bình thường.
✅ Real-time update	Khi Product đổi tên, event được publish → Inventory cập nhật cache ngay. Không cần gọi API mỗi lần load.
✅ Hiệu năng cao	Dữ liệu hiển thị tồn kho lấy từ Redis, cực nhanh, không bị trễ mạng hay nghẽn service khác.
✅ Scalability (mở rộng dễ)	Sau này bạn thêm service khác (ví dụ “Order”) → chỉ cần subscribe event từ Product là xong, không cần sửa code Product.
✅ Được dùng thực tế trong hệ thống lớn	Mô hình này giống như trong Shopee, Lazada, Netflix, Booking.com — tất cả đều dùng event-driven + cache để tránh phụ thuộc giữa service.

mai xem phần cache thông tin sản phẩm ở tạo và xóa bên consume

ở trang chỉnh sửa tồn kho sẽ trả ra thông tin sản phẩm là id, tên, size, tồn kho của size đó
xem xem nên thiết kế ở trang cập nhật tồn kho thì cập nhật ở trang đó luôn hay ở trang khác
nếu ở trang khác thì cần thêm id lấy tồn kho cho 1 size đó


đang đến  api thêm giỏ hàng (chat gpt làm cart-service)

1. Thêm sản phẩm vào giỏ hàng         (xong)
2. Lấy danh sách giỏ hàng
3. Cập nhật tick chọn (selected)      (xong)
4. Cập nhật số lượng sản phẩm         (xong)
5. Xóa sản phẩm khỏi giỏ hàng         (xong)
6. Lấy danh sách sản phẩm được chọn (để đặt hàng)
7. Xóa toàn bộ giỏ hàng (sau khi đặt hàng xong)


hiện tại đang làm theo cách nếu update size mới thì chỉ xóa và thêm các size
cần thiêt và giữ nguyên size để không mất tồn kho


nếu 1 size nào đó đã lên đơn, nhưng sau đó size đó bị xóa thì sao
vẫn ship nốt hay báo hủy ?