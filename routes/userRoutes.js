const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Role} = require('../models/roleModel');
const User = require('../models/userModel');
const Landlord = require('../models/landlordModel');
const { uploadImageUser, deleteImageUser } = require('../upload-image/uploadImgUser');
const getCurrentDateFormatted = require('../getDate/getDateNow');

// Get all users
router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({IsDelete: false}).select('-Password');; 
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }  
        res.status(200).json({ message: 'Get users success!', data: users });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get user by email
router.get('/api/user/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ Email: email, IsDelete: false }).select('-Password'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }  
        res.status(200).json({ message: 'Get users success!', data: user });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// create new user
router.post('/api/user', uploadImageUser, async (req, res) => {
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
                    IsDelete: false,
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
            IsDelete: false,
        });

        // Lưu người dùng
        await newUser.save();


        res.status(201).json({ message: 'User created successfully!', data: newUser });

    } catch (error) {
        // Xử lý lỗi server
        res.status(500).json({ message: 'Server error', error });
    }
});

// update user by id
router.put('/api/user', uploadImageUser, async (req, res) => {
    const { username, email, password, phoneNumber, address, roleID, userID } = req.body;
    const image = req.file ? req.file.filename : '';
    
    try {
        // Kiểm tra người dùng hiện tại có phải là Admin hay không
        const currentUser = await User.findById(userID); // Giả sử `userID` là ID của người dùng đang thực hiện yêu cầu
        if (!currentUser) {
            deleteImageUser(image);
            return res.status(404).json({ message: 'User not found' });
        }

        // Tìm role của người dùng hiện tại
        const currentRole = await Role.findById(currentUser.RoleID);
        if (!currentRole || currentRole.RoleName !== 'Admin') {
            deleteImageUser(image);
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        // Tìm user theo email
        const existingUser = await User.findOne({ Email: email });
        if (!existingUser) {
            deleteImageUser(image);
            return res.status(404).json({ message: 'User not found' });
        }

        // Kiểm tra roleID có hợp lệ hay không
        if (roleID && !mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Invalid Role ID format' });
        }

        // Kiểm tra role hợp lệ nếu có roleID
        if (roleID) {
            const role = await Role.findById(roleID);
            if (!role) {
                deleteImageUser(image);
                return res.status(400).json({ message: 'Role unvalid!' });
            }

            // Kiểm tra nếu vai trò ban đầu là Landlord và vai trò mới không phải Landlord
            const oldRole = await Role.findById(existingUser.RoleID); 
            if (oldRole && oldRole.RoleName === 'Landlord' && role.RoleName !== 'Landlord') {
                // Xóa thông tin Landlord nếu người dùng chuyển từ Landlord sang vai trò khác
                await Landlord.findOneAndDelete({ Email: email });
            }

            // Nếu role là Landlord, cập nhật hoặc tạo mới thông tin landlord
            if (role.RoleName === 'Landlord') {
                const landlord = await Landlord.findOne({ Email: email });

                if (landlord) {
                    // Nếu đã có Landlord, cập nhật thông tin
                    if (username) landlord.LandlordName = username;
                    if (image) landlord.Image = image;
                    if (address) landlord.Address = address;
                    if (phoneNumber) landlord.PhoneNumber = phoneNumber;
                    landlord.UpdateAt = getCurrentDateFormatted();
                    landlord.UpdateBy = userID;

                    await landlord.save();
                } else {
                    // Nếu chưa có, tạo mới Landlord
                    const newLandlord = new Landlord({
                        LandlordName: username || existingUser.Username,
                        Email: email,
                        Image: image,
                        Address: address,
                        PhoneNumber: phoneNumber,
                        CreateAt: getCurrentDateFormatted(),
                    });
                    await newLandlord.save();
                }
            }
        }

        const updateDate = getCurrentDateFormatted();

        // Cập nhật các trường nếu có thay đổi
        if (username) existingUser.Username = username;
        if (password) existingUser.Password = password;
        if (roleID) existingUser.RoleID = roleID;
        if (phoneNumber) existingUser.PhoneNumber = phoneNumber;
        if (address) existingUser.Address = address;

        // Cập nhật hình ảnh nếu có hình ảnh mới
        if (image) {
            if (existingUser.Image) {
                deleteImageUser(existingUser.Image); // Xóa ảnh cũ
            }
            existingUser.Image = image;
        }

        // Cập nhật thời gian sửa đổi
        existingUser.UpdateAt = updateDate;
        existingUser.UpdateBy = userID;

        // Lưu thay đổi
        await existingUser.save();

        res.status(200).json({ message: 'User updated successfully!', data: existingUser });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



// Delete user by email
router.delete('/api/user', async (req, res) => {
    const { email } = req.body;
    try {   
        // Find and delete user by email
        const user = await User.findOneAndDelete({ Email: email });
        
        if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
        } 

        // Check if user has role as 'Landlord'
        const role = await Role.findById(user.RoleID);
        if (role && role.RoleName === 'Landlord') {
            // Delete landlord data if user has role 'Landlord'
            await Landlord.findOneAndDelete({ Email: email });
        }

        // If exist image then delete
        if (user.Image) {
            deleteImageUser(user.Image);
        }

        res.status(200).json({ message: 'User and associated Landlord data deleted successfully', data: user });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;