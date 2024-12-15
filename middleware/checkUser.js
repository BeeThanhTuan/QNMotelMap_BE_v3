const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ACCESS_TOKEN_SECRET = 'ntt_access_token_secret';

const checkUser = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Lấy token từ header Authorization
    if (!token) {
        return res.status(401).json({ message: 'Không có token!' });
    }
    try {
        // Giải mã token để lấy email người dùng
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const email = decoded.email;

        // Tìm người dùng trong cơ sở dữ liệu
        const existingUser = await User.findOne({ Email: email, IsDelete: false });

        if (!existingUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        req.user = existingUser; // Gắn thông tin người dùng vào req
        next(); // Tiếp tục thực thi
    } catch (error) {
        console.error('Lỗi xác thực token:', error);
        res.status(500).json({ message: 'Lỗi hệ thống trong quá trình xác thực người dùng!' });
    }
};

module.exports = checkUser;
