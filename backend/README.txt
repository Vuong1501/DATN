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



-- TÍNH NĂNG
--- ĐĂNG KÍ
---- Ở màn hình đăng nhập hiển thị nút đăng nhập bằng gg hoặc nút đăng kí, nếu ấn nút đăng kí thì chuyển sang form đăng kí, nếu đăng kí bình thường thì khi đăng kí xong cần điền tài
khoản, mật khẩu để đăng nhập, và bên form đăng kí cũng có đăng kí bằng gg, sau khi xác nhận thì sẽ cho đăng nhâp luôn





