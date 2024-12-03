const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const User = require('../models/userModel');
const { Role } = require('../models/roleModel');
const Landlord = require('../models/landlordModel');
const getCurrentDateFormatted = require('../getDate/getDateNow');

const router = express.Router();

const ACCESS_TOKEN_SECRET = 'ntt_access_token_secret';
const REFRESH_TOKEN_SECRET = 'ntt_refresh_token_secret';

// Middleware để parse cookies
router.use(cookieParser());

// Login
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Tìm tài khoản theo email
        const user = await User.findOne({ Email: email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại!' });
        }

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.Password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác!' });
        }

        // Tạo Access Token
        const accessToken = jwt.sign(
            { email: user.Email, roleID: user.RoleID },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // Tạo Refresh Token
        const refreshToken = jwt.sign(
            { email: user.Email, roleID: user.RoleID },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );


        // Gửi Access Token về FE
        res.status(200).json({
            message: 'Đăng nhập thành công!',
            data: {
                accessToken,
                refreshToken
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau!' });
    }
});

// Refresh Token
router.post('/api/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
        // Xác minh Refresh Token
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        // Tạo Access Token mới
        const newAccessToken = jwt.sign(
            { email: decoded.email, roleID: decoded.roleID },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
        console.error('Error refreshing token:', err);
        res.status(403).json({ message: 'Unauthorized' });
    }
});

// Verify Token
router.get('/api/verify-token', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token không tồn tại!' });

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        res.status(200).json({ message: 'Token hợp lệ!', data: decoded });
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ!', error: error.message });
    }
});

// Register
router.post('/api/register', async (req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const createDate = getCurrentDateFormatted();

    try {
        // Kiểm tra email đã tồn tại trong User hoặc Landlord
        const existingUserOrLandlord = await User.findOne({ Email: email }) || await Landlord.findOne({ Email: email });
        if (existingUserOrLandlord) {
            return res.status(400).json({ message: 'Email đã tồn tại!' });
        }

        // Kiểm tra roleID có hợp lệ không
        const role = await Role.findById(roleID);
        if (!role || !['Landlord', 'Client'].includes(role.RoleName)) {
            return res.status(400).json({ message: 'Vai trò không hợp lệ!' });
        }

        // Nếu role là 'Landlord', tạo thêm Landlord document
        if (role.RoleName === 'Landlord') {
            if (!phoneNumber) {
                return res.status(400).json({ message: 'Số điện thoại là bắt buộc đối với vai trò Landlord!' });
            }

            const newLandlord = new Landlord({
                LandlordName: username,
                Email: email,
                Image: '', // Không có ảnh mặc định
                Address: address,
                PhoneNumber: phoneNumber,
                CreateAt: createDate,
            });

            await newLandlord.save();
        }


        // Tạo người dùng mới
        const newUser = new User({
            Username: username,
            Email: email,
            Password: hashedPassword,
            RoleID: roleID,
            PhoneNumber: phoneNumber,
            Address: address,
            Image: '',
            CreateAt: createDate,
        });

        await newUser.save();
        res.status(201).json({ message: 'Đăng ký người dùng thành công!', data: newUser });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi máy chủ!', error: error.message });
    }
});

module.exports = router;
