const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {Role} = require('../models/roleModel');
const Landlord = require('../models/landlordModel');
const { uploadImageUser, deleteImageUser } = require('../upload-image/uploadImgUser');
const getCurrentDateFormatted = require('../getDate/getDateNow');

// login
router.post('/api/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        // Tìm tài khoản trong cơ sở dữ liệu dựa trên email
        const account = await User.findOne({ Email: email });
        // Kiểm tra xem tài khoan có tồn tại không
        if (!account) {
            return res.status(404).json({ message: 'Email invalid' });
        }
        // So sánh mật khẩu nhập vào với mật khẩu lưu trong cơ sở dữ liệu
        const isPasswordValid = await bcrypt.compare(password, account.Password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        // Nếu mọi thứ hợp lệ, tạo JSON Web Token (JWT)
        const token = jwt.sign({email: account.Email} , 'ntt-secret-key', { expiresIn: '1h' });
        res.status(201).json({ message: 'Login successfully!', data: token });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

//regiser new 
router.post('/api/register', uploadImageUser, async (req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const image = req.file ? req.file.filename : '';
    const createDate = getCurrentDateFormatted();
    
    try {
        // Kiểm tra email đã tồn tại hay chưa
        const existingUser = await User.findOne({ Email: email });
        if (existingUser) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Email already exists!' });
        }

        // Kiểm tra roleID có hợp lệ hay không
        if (!mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Invalid Role ID format' });
        }
  
        const role = await Role.findById(roleID);
        if (!role) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role not valid!' });
        }
        
        if (role.RoleName === 'Admin') {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role invalid, must be Landlord or Client!' });
        }
        
        // Nếu role là 'Landlord', tạo thêm landlord
        if (role.RoleName === 'Landlord') {
            if(phoneNumber){
                const newLandlord = new Landlord({
                    LandlordName: username,
                    Email: email,
                    Image: image,
                    Address: address,
                    PhoneNumber: phoneNumber,
                    CreateAt: createDate,
                });
                await newLandlord.save();
            }
            else{
                deleteImageUser(image);
                return res.status(400).json({ message: 'Phone Number is required!' });
            }
        }

        // Tạo người dùng mới
        const newUser = new User({
            Username: username,
            Email: email,
            Password: password,
            RoleID: roleID,
            PhoneNumber: phoneNumber,
            Address: address,
            Image: image,
            CreateAt: createDate,
        });
        // Lưu người dùng
        await newUser.save();


        res.status(201).json({ message: 'User created successfully!', data: newUser });

    } catch (error) {
        // Xử lý lỗi server
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;