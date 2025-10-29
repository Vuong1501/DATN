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

tách StockService, categoryService(Gom chung Category + SubCategory vào cùng một service) xem chat gpt đoạn CATEGORY - SERVICE - TỒN KHO

product-service gọi sang categoryService bằng rabbitMQ

-- xem phần validate trước khi tạo sản phẩm mới

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

tức là khi thêm sản phẩm thì product publish sang inventory
còn khi lấy sản phẩm thì product gọi sang inventory để lấy thông tin tồn kho(có thể thêm redis như bên category)


khi thêm sản phẩm + size => publish sự kiện sang inventory => inventory cache(khi thay đổi tồn kho cũng sẽ cache lại)
khi thêm sản phẩm mới thì chỉ publish sang inventory để stock của size đó bằng 0, phải có 1 trang để
gọi api bên inventory-service để thêm tồn kho

