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


cart, inventory đang lắng nghe sự kiện thêm sửa xóa của product

1. Thêm sản phẩm vào giỏ hàng         (xong)
2. Lấy danh sách giỏ hàng             (xong)
3. Cập nhật tick chọn (selected)      (xong)
4. Cập nhật số lượng sản phẩm         (xong)
5. Xóa sản phẩm khỏi giỏ hàng         (xong)
7. Xóa toàn bộ giỏ hàng (sau khi đặt hàng xong) cần làm (xong)


order-service
1. Tạo đơn hàng
2. Lấy danh sách đơn hàng của user, User xem tất cả các đơn họ đã đặt.
3. Xem chi tiết đơn hàng
User click vào 1 đơn → xem trạng thái, sản phẩm, tổng tiền, ngày đặt,…
4. Theo dõi trạng thái đơn hàng
Phần này nằm trong API ở trên, nhưng có thể tách riêng nếu muốn.
5. Admin cập nhật trạng thái đơn hàng
6. Lấy danh sách đơn hàng (QUẢN TRỊ - Admin)
7. Hủy đơn hàng
User có thể hủy đơn nếu đơn còn ở trạng thái:
pending
confirmed
8. Kiểm tra giỏ hàng trước khi tạo đơn (nếu muốn chuẩn)
Trước khi tạo đơn:
Kiểm tra số lượng hàng tồn trong Inventory service
Kiểm tra sản phẩm có bị xóa chưa
Giá có thay đổi không
(Option nhưng thể hiện kỹ năng microservice)
9. Giảm số lượng tồn kho sau khi xác nhận đơn
Tuỳ chiến lược:
Giảm tồn kho khi tạo đơn
Hoặc khi admin “confirmed” đơn
(Shop lớn thì giảm khi thanh toán → nhưng đồ án tùy chọn)


hiện tại đang làm theo cách nếu update size mới thì chỉ xóa và thêm các size
cần thiêt và giữ nguyên size để không mất tồn kho


nếu 1 size nào đó đã lên đơn, nhưng sau đó size đó bị xóa thì sao
vẫn ship nốt hay báo hủy ?

đang đến đoạn phân vân xem dùng api dev của giao hàng nhanh, giao hàng tiết kiệm hay tự làm

lấy user id ở đâu, name User
các dữ liệu kia lấy từ cache hay từ getall cart trả ra
kiểm tra tồn kho
có lấy từ rest đề phòng 
có phải public event nào ra không
ở NotificationService có lắng nghe sự kiện đặt hàng thành công
có demo tình huống flashsale thì có phải ở tạo đơn hàng này không
validate các số điện thoaijm địa chỉ, ... và giao diện đặt hàng như nào




Trong môi trường bình thường (non-flash-sale)
→ chỉ cần transaction DB + check tồn kho.

Nhưng FLASH SALE hàng trăm ngàn request thì cách dùng đúng là:
✔ Cách tốt nhất: RabbitMQ + Queue để xử lý tuần tự
Flow chuẩn:

User nhấn MUA → FE gửi request → API trả về “đang xử lý”.
API publish event vào queue: order.flashsale.request
Worker nhận từng request trong hàng đợi:
kiểm tra tồn kho (Redis hoặc DB)
atomic decrement
tạo order
Trả kết quả về user qua WebSocket hoặc polling.



dữ liệu địa chỉ, số điện thoại là người dùng nhập

1. Mở trang giỏ hàng(khi này gọi api lấy danh sách giỏ hàng ra kèm các sản phẩm được chọn + tổng giá)
2. người dùng ấn mua hàng => chuyển sang màn hình checkout, khi này mang theo các sản phẩm được tick chọn(state nội bộ để mang theo dữ liệu)
3. màn hình checkout hiển thị 
-danh sách sản phẩm được chọn
-form nhập địa chỉ (sau này có thể để làm mặc định như tiktok)
-ghi chú
4. bấm đặt hàng
- gọi api tạo đơn hàng, nhưng cần gọi api cart-service vì không tin dữ liệu fe gửi lên vì có thể bị hack
 4.1 gọi sang cart-service lấy giỏ hàng chuẩn
 4.2 lọc sản phẩm có selected = true
 4.3 lấy dữ liệu thật từ redis hoặc rest sang product-service
 4.4 check tồn kho(flash sale thì dùng rabbit + atomic của redis hoặc transaction)
 4.5 tạo đơn hàng + orderDetail (snapshot)
 4.6 gửi event giảm tồn kho
 4.7 gọi api bên cart-service để xóa các sản phẩm đã mua trong giỏ hàng



CHÚ Ý: 
Tại sao phải gọi lại /cart khi ấn đặt hàng?
Vì:
▶ Người dùng có thể mở 2 tab
Tab A: bỏ chọn item
Tab B: nhấn đặt hàng → không đúng/không khớp.
▶ Người dùng có thể refresh giỏ hàng
Frontend cache không còn đúng.
▶ Giỏ hàng có thể thay đổi sau khi mở checkout
Số lượng không còn đúng.




các sự kiện đang được gửi
- USER-SERVICE đang gửi exchange notification_exchange với type là direct, routing key là forgot_password
=> NOTIFICATION-SERVICE đang lắng nghe 
1. exchange notification_exchange với type là direct, routing key là forgot_password
2. exchange notification_exchange với type là direct, routing key là order_success

- PRODUCT-SERVICE đang gửi exchange product_exchange, với type là topic với các key là thêm sửa xóa sản phẩm
 => bên INVENTORY-SERVICE đang lắng nghe các sự kiện đó
- CATEGORY-SERVICE đang gửi exchange category_events với type là fanout với các key là thêm sửa xóa danh muc
 => bên PRODUCT-SERVICE đang lắng nghe các sự kiện đó


 -nếu tách flashsale ra service riêng thì khi chi tiết sản phẩm có thể hiển thị giá gốc,
 giá flash sale, thời gian đếm ngược



khi tạo đơn hàng thành công thì bên order-serivce cần bắn event sang inventory để giảm tồn kho sản phẩm đó
trong redis cũng như db
và bắn sang NotificationService để thông báo cho người dùng đặt hàng thành công



cập nhật trạng thái sản phẩm đang bị cập nhật được của người khác



luồng đặt hàng đang như sau 
-khi đặt hàng, bên order sẽ kiểm tra tồn kho xem đủ không, nếu đủ thì sẽ tạo đơn hàng và bắn sự 
kiện order.created sang bên inventory để trừ tôn kho(nếu thành công thì bên inventory sẽ publish
lại sự kiện stock.decresed sang bên order để order biết, nếu fail thì bắn sự kiện stock.fail sang bên order)
-sau khi order-service nhận lại sự kiện từ inventory, nếu thành công thì sẽ gửi sự kiện sang bên 
notification để gửi mail đặt hàng thành công cho khách


bây giờ luồng đặt hàng đang như sau, nếu trường hợp bình thường thì chỉ cần tính atomic cơ bản của redis
như là dùng decr thôi, sau đó mới giảm trong db
còn khi vào tình huống flashsale thì các request đến phải đi vào rabbit trước để xử lí tuần tự



đã hoàn thiện luồng đặt hàng khi bình thường, bên order-service kiểm tra tồn kho Trước
=> tạo đơn hàng=> publish sự kiện order.created sang
-cart-service: để xóa item đó trong giỏ hàng sau khi đặt thành công
-inventory-service: để trừ tồn kho trong redis và db(đã có rollback nếu lỗi) => publish lại order-service
=> nhận và cập nhật trạng thái đơn hàng đó => publish sang notification để gửi mail


🧠 Bạn nên dùng thêm 1 trick:
SETNX key “đang xử lý”

→ để cùng 1 user không spam nút mua 20 lần trong 1 giây.


mai xem phần email sending error debug ở gpt



bên flashsale sẽ gửi exchange flash_exchange, routing key là flash.order(type topic)
bên order-service lắng nghe để tạo đơn hàng(riêng) => publish sự kiện sang inventory(giống luồng bình thường)



khi flash-sale bắn sự kiện sang bên order-service, nó lắng nghe và tạo ra 1 bản ghi gọi là đặt chỗ (có thể
thêm 1 bảng nữa cho order-service), sau đó mới nhập thông tin địa chỉ, người nhận rồi 
mới tạo đơn hàng thật sự => sau đó publish sang inventory như bình thường

khi ấn mua ngay ở flash sale thì gọi api buy bên flash sale, sau khi điền thông tin 
địa chỉ thì gọi thêm 1 api nữa(chưa có) để thực sự đặt hàng(thêm 1 bảng nữa trong order-service)

Nếu muốn làm giống Shopee/Tiki/Lazada:

➡ Cách 2: Preload trước giờ sale (cron job)
→ Đây là cách chuẩn, tối ưu hiệu năng.

với trường hợp nếu đã cache xong rồi mà admin sửa flash sale, nếu sale đã được cache, 
thì phải cập nhật lại Redis ngay.
nếu đang trong thời gian flash sale thì sẽ không được update thông tin sản phẩm sale


FLASH-SALE
↓ (Lua + Redis)  
Flash Sale Service  
↓ (publish flash.order)  
RabbitMQ  
↓  
Order Service worker (flash)  
↓  
FlashPendingOrder (tạm)  
↓  
(người dùng bấm thanh toán trong 10 phút)  
↓  
POST /flash-sale/complete-order  
↓  
Order Service (tạo đơn thật)  
↓ (publish order.created)  
Inventory Service  
↓ (publish stock.decreased / stock.failed)  
Order Service worker (status)  
↓  
Gửi mail / thông báo  
↓  
Hoàn tất




mai đọc trong cat gpt đoạn đến hiện tại luồng của tôi là flash-sale lua + redis + publish rồi, bên order-service lắng nghe, tạo work queue và tạo đơn tạm rồi, bây giờ khi người dùng đặt được hàng thì bên api của flash-sale-service sẽ trả ra return { ok: true, requestId, remaining: Number(remaining) };, sau đó hiển thị form nhập thông tin trong 10p, nếu ấn thánh toán sẽ gọi api POST /flash-sale/complete-order và tạo đơn thật, rồi publish sự kiện như luồng bình thường như là sang inventory trừ tồn kho trong db + redis thường => order-service nhận sự kiện trừ thành công và cập nhật trạng thái đơn hàng rồi gửi mail à

đang viết api để gọi sau khi người dùng điền thông tin


-sẽ có 1 trang flash sale riêng, khi ấn vào mua ngay thì sẽ vào trang chi tiết sản phẩm(trang này
không có nút thêm giỏ hàng, chỉ có nút mua ngay, nếu thành công thì sang trang có form điền thông tin)
-nếu 1 sản phẩm đã có trong giỏ hàng từ trước, đến khi nó flash sale, nếu mua từ giỏ hàng thì nó sẽ bán với giá gốc

🟧 3. Shopee/Lazada làm thế nào?
Nếu sản phẩm trong giỏ đang có Flash Sale, họ sẽ hiển thị:
một nhãn “Sản phẩm đang Flash Sale → mua ngay để được giá tốt hơn”
khi click vào → chuyển sang luồng flash sale
không áp dụng giá flash sale trong giỏ hàng

đã xong api admin thêm, cập nhật flashsale, cần xem là bên order-service cần thêm những api gì
như là chi tiết sản phẩm nếu ấn flashsale, bên flash-sale-service cần thêm api gì, validate, quyền cập nhật
thêm vào apigateway

đang bị đến thời gian chuẩn bị flash sale mà nó chưa cache stock
đang bị lệch thời gian do UTC, đang có cách là dùng 
→ LƯU THỜI GIAN DƯỚI DẠNG TIMESTAMP (epoch milliseconds)

Không dùng DATETIME, không dùng timezone.
root


code hiện tại vẫn chưa tự động chạy khi gần đến flash_sale để cache trong redis, và api là phải gọi
rồi trả ra, nó không tự động được(xem giải tuyết lỗi timezone)

-đang test đến đoạn api mua hàng, đã đến luồng khi test sẽ ra flash sale kết thúc rồi

kiểm tra xem đã có đoạn trừ tồn kho ở trong bảng flash sale hay chưa


mấy lần điền thông tin sau khi đặt được chỗ mà bị lỗi thì redis trong flash_sale:stock vẫn bị trừ
còn của redis inventory thì đã đúng