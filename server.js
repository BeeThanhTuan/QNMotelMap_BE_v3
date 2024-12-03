const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser'); // Có thể giữ nếu bạn vẫn muốn dùng, nhưng sẽ thay thế bằng express.json và express.urlencoded
const connectDB = require('./connectDB/connectDB.js');

// Sử dụng route liên quan
const authRoutes = require('./routes/authRoutes.js');
const roleRoutes = require('./routes/roleRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const motelRoutes = require('./routes/motelRoutes.js');
const roomTypeRoutes = require('./routes/roomTypeRoutes.js');
const ratingRoutes = require('./routes/ratingRoutes.js');
const favoriteMotelRoutes = require('./routes/favoriteMotelRoutes.js');
const convenientRoutes = require('./routes/convenientRoutes.js');
const landlordRoutes = require('./routes/landlordRoutes.js');

// Khởi tạo ứng dụng Express
const app = express();
const port = 3000;

// Cấu hình CORS cho phép gửi cookie từ frontend (localhost:4200)
const corsOptions = {
  origin: 'http://localhost:4200', // URL của frontend
  credentials: true, // Cho phép gửi cookie
};

app.use(cors(corsOptions)); // Sử dụng CORS với cấu hình trên

// Middleware cho phép cookie và xử lý JSON
app.use(cookieParser()); // Middleware để xử lý cookies
app.use(express.json({ limit: '10mb' })); // Để parse JSON data, kích thước lớn hơn nếu cần
app.use(express.urlencoded({ extended: true })); // Để parse URL-encoded data

// Sử dụng express.static để phục vụ các file từ thư mục 'resources'
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// Kết nối đến cơ sở dữ liệu
connectDB();

// Sử dụng các route liên quan
app.use('/', authRoutes);
app.use('/', roleRoutes);
app.use('/', userRoutes);
app.use('/', motelRoutes);
app.use('/', roomTypeRoutes);
app.use('/', ratingRoutes);
app.use('/', favoriteMotelRoutes);
app.use('/', convenientRoutes);
app.use('/', landlordRoutes);

// Lắng nghe yêu cầu trên cổng 3000
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
