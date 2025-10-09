npm i cors dotenv express jsonwebtoken multer nodemon stripe validator brcypt cloudinary mysql2
npm install express mysql2 redis amqplib
npm install --save-dev nodemon


-- trong dockerfile sẽ 2 phần, 1 phần là chạy để test, 1 phần là chạy để build production
---- lệnh chạy DEV: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build (chỉ build khi có thư viện mới, ...)
---- lệnh chạy PROD: docker-compose -f docker-compose.yml up --build -d (bỏ -d để thấy terminal đang chạy)

-- chạy code ở folder backend

-- lệnh kiểm tra bảng csdl
----- docker exec -it mysql_container mysql -u root -p mydb(thay mydb thành db mà service đang sử dụng)
----- USE user_db;
----- SHOW TABLES;
----- SELECT * FROM users;


-- lệnh log 1 service nào đó
----- docker-compose logs -f product-service

-- lệnh THÊM ADMIN ĐẦU TIÊN
docker exec -it id-container-user sh => node src/seedAdmin.js

-- Khi cài thư viện mới cần build lại với --no-cache

-- xem lấy đúng biến môi trường chưa
docker exec -it <container_id> env | grep GOOGLE_CLIENT_SECRET


-- DEMO 1 triệu người cùng mua 1 sản phẩm, tắt 1 service thì service khác vẫn hoạt động bình thường(xem trong chat gpt)
------------------ Hiện tại chưa làm trang admin, định là client và admin cùng đăng nhập 1 form login, nếu admin sẽ có thêm nút
admin panel sau login, ấn vào sẽ sang trang admin(xem chat gpt LÚC NÀO LÀM TRANG ADMIN THÌ XEM)



-- TÍNH NĂNG
--- ĐĂNG KÍ
---- Ở màn hình đăng nhập hiển thị nút đăng nhập bằng gg hoặc nút đăng kí, nếu ấn nút đăng kí thì chuyển sang form đăng kí, nếu đăng kí bình thường thì khi đăng kí xong cần điền tài
khoản, mật khẩu để đăng nhập, và bên form đăng kí cũng có đăng kí bằng gg, sau khi xác nhận thì sẽ cho đăng nhâp luôn


Client secret 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
Client ID 852218064853-7aog4t8ibs7gfio6rs4vs3fo1ve5jqlg.apps.googleusercontent.com

Trong e-commerce, quan trọng nhất là tính nhất quán dữ liệu (đơn hàng – thanh toán – tồn kho) và khả năng chịu tải cao khi traffic đột biến (sale, flash sale).
Ứng dụng thêm api-gateway(xem đoạn chat LÚC NÀO LÀM API-GATEWAY thì xem)

đang phân vân xem đoạn upload ảnh lên cloudinary thì dùng cách nào 


tách StockService, categoryService(Gom chung Category + SubCategory vào cùng một service) xem chat gpt đoạn CATEGORY - SERVICE - TỒN KHO

product-service gọi sang categoryService bằng rabbitMQ

-- xem phần validate trước khi tạo sản phẩm mới

KHI làm đến đoạn tính nhất quán giữa các service thì xem đoạn chatgpt(KHI LÀM TÍNH NHẤT QUÁN)
xem các api đó cần authen không, hay là authen ở bên api gateway






