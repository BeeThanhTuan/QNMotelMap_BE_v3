const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Role } = require('../models/roleModel');
const User = require('../models/userModel');
const Landlord = require('../models/landlordModel');
const { uploadImageUser, deleteImageUser } = require('../upload-image/uploadImgUser');
const getCurrentDateFormatted = require('../getDate/getDateNow');
const checkRoleAdmin = require('../middleware/checkRoleAdmin');

// Lấy danh sách tất cả người dùng
router.get('/api/users', async(req, res) => {
    try {
        const users = await User.find({ IsDelete: false }).select('-Password').populate('RoleID');
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng nào' });
        }
        res.status(200).json({ message: 'Lấy danh sách người dùng thành công!', data: users });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Lấy thông tin người dùng theo email
router.get('/api/user/:email', async(req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ Email: email, IsDelete: false }).select('-Password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.status(200).json({ message: 'Lấy thông tin người dùng thành công!', data: user });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Tạo người dùng mới
router.post('/api/user', async(req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const createDate = getCurrentDateFormatted();
    try {
        // Kiểm tra email đã tồn tại hay chưa
        const existingUser = await User.findOne({ Email: email, IsDelete: false });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại!' });
        }

        // Kiểm tra roleID có hợp lệ hay không
        if (!mongoose.isValidObjectId(roleID)) {
            return res.status(400).json({ message: 'Định dạng Role ID không hợp lệ' });
        }

        const role = await Role.findById(roleID);
        if (!role) {
            return res.status(400).json({ message: 'Role không hợp lệ!' });
        }

        // Nếu role là 'Landlord', tạo thêm landlord
        if (role.RoleName === 'Landlord') {
            if (phoneNumber) {
                const newLandlord = new Landlord({
                    LandlordName: username,
                    Email: email,
                    Image: null,
                    Address: address,
                    PhoneNumber: phoneNumber,
                    CreateAt: createDate,
                    IsDelete: false,
                });

                await newLandlord.save();
            } else {
                deleteImageUser(image);
                return res.status(400).json({ message: 'Số điện thoại là bắt buộc!' });
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
            Image: null,
            CreateAt: createDate,
            IsDelete: false,
        });

        // Lưu người dùng
        await newUser.save();

        res.status(201).json({ message: 'Tạo người dùng thành công!', data: newUser });

    } catch (error) {
        // Xử lý lỗi server
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// create new user role admin
router.post('/api/user-role-admin', checkRoleAdmin, uploadImageUser, async(req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const image = req.file ? req.file.filename : '';
    const createDate = getCurrentDateFormatted();
    try {
        // Kiểm tra email đã tồn tại hay chưa
        const existingUser = await User.findOne({ Email: email, IsDelete: false });
        if (existingUser) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Email đã tồn tại!' });
        }

        // Kiểm tra roleID có hợp lệ hay không
        if (!mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role ID không hợp lệ!' });
        }

        const role = await Role.findById(roleID);
        if (!role) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role không hợp lệ!' });
        }

        // Nếu role là 'Landlord', tạo thêm landlord
        if (role.RoleName === 'Landlord') {
            if (phoneNumber) {
                const newLandlord = new Landlord({
                    LandlordName: username,
                    Email: email,
                    Image: null,
                    Address: address,
                    PhoneNumber: phoneNumber,
                    CreateAt: createDate,
                    IsDelete: false,
                });

                await newLandlord.save();
            } else {
                deleteImageUser(image);
                return res.status(400).json({ message: 'Số điện thoại là bắt buộc!' });
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
            Image: null,
            CreateAt: createDate,
            IsDelete: false,
        });

        // Lưu người dùng
        await newUser.save();
        const newUserAdd = await User.findById(newUser._id).select('-Password').populate('RoleID');
        res.status(201).json({ message: 'Tạo người dùng thành công!', data: newUserAdd });

    } catch (error) {
        // Xử lý lỗi server
        deleteImageUser(image);
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});

// update user by id with role admin
router.put('/api/user-role-admin', checkRoleAdmin, uploadImageUser, async(req, res) => {
    const { username, email, phoneNumber, address, roleID } = req.body;
    const image = req.file ? req.file.filename : '';

    try {
        const userUpdate = req.user;
        // Tìm user theo email
        const existingUser = await User.findOne({ Email: email });
        if (!existingUser) {
            deleteImageUser(image);
            return res.status(404).json({ message: 'Người dùng không tìm thấy!' });
        }

        // Kiểm tra roleID có hợp lệ hay không
        if (roleID && !mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role ID không hợp lệ!' });
        }

        // Kiểm tra role hợp lệ nếu có roleID
        if (roleID) {
            const role = await Role.findById(roleID);
            if (!role) {
                deleteImageUser(image);
                return res.status(400).json({ message: 'Role không hợp lệ!' });
            }

             // Kiểm tra nếu vai trò ban đầu là Landlord và vai trò mới không phải Landlord
             const oldRole = await Role.findById(existingUser.RoleID);
             if (oldRole && oldRole.RoleName === 'Landlord' && role.RoleName !== 'Landlord') {
                 const landlord = await Landlord.findOne({ Email: email });
 
                 if (landlord && landlord.ListMotels && landlord.ListMotels.length > 0) {
                     deleteImageUser(image);
                     return res.status(400).json({
                         message: 'Không thể thay đổi vai trò. Landlord vẫn đang quản lý các nhà trọ!'
                     });
                 }
 
                 // Xóa thông tin Landlord nếu không có motels
                 await Landlord.findOneAndDelete({ Email: email });
             }

            // Nếu role là Landlord, cập nhật hoặc tạo mới thông tin Landlord
            if (role.RoleName === 'Landlord') {
                const landlord = await Landlord.findOne({ Email: email });

                if (landlord) {
                    // Nếu đã có Landlord, cập nhật thông tin
                    if (username) landlord.LandlordName = username;
                    if (image) landlord.Image = image;
                    if (address) landlord.Address = address;
                    if (phoneNumber) landlord.PhoneNumber = phoneNumber;
                    landlord.UpdateAt = getCurrentDateFormatted();
                    landlord.UpdateBy = userUpdate._id;

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
        existingUser.UpdateBy = userUpdate._id;

        // Lưu thay đổi
        await existingUser.save();
        const newUserUpdate = await User.findById(existingUser._id).select('-Password').populate('RoleID');
        res.status(200).json({ message: 'Cập nhật người dùng thành công!', data: newUserUpdate });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});

//sort delete user
router.delete('/api/soft-delete-user/:email', checkRoleAdmin, async (req, res) => {
    const { email } = req.params;
    console.log(email);
    const updateDate = getCurrentDateFormatted();
    
    try {
        const userUpdate = req.user;
        // Tìm người dùng theo email và trạng thái IsDelete = false
        const user = await User.findOne({ Email: email, IsDelete: false });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng nào với email này.' });
        }

        user.IsDelete = true;

        // Kiểm tra nếu vai trò của người dùng là 'Landlord'
        const role = await Role.findById(user.RoleID);
        if (role && role.RoleName === 'Landlord') {
            // Tìm Landlord và kiểm tra ListMotels
            const landlord = await Landlord.findOne({ Email: email, IsDelete: false });
            if (landlord) {
                const motelCount = landlord.ListMotels ? landlord.ListMotels.length : 0;

                if (motelCount > 0) {
                    return res.status(400).json({ 
                        message: 'Không thể xóa vì Landlord có danh sách nhà trò đang hoạt động.' 
                    });
                }

                // Đánh dấu xóa Landlord nếu không có Motel
                landlord.IsDelete = true;
                await landlord.save();
            }
        }
        user.UpdateAt = updateDate;
        user.UpdateAt = userUpdate._id
        // Lưu thay đổi người dùng
        await user.save();
        // Phản hồi thành công
        res.status(200).json({ 
            message: 'Người dùng và dữ liệu Landlord liên quan đã được xóa thành công.', 
            data: { user } 
        });

    } catch (error) {
        // Xử lý lỗi hệ thống
        res.status(500).json({ message: 'Lỗi server.', error });
    }
});


// Delete user by email
router.delete('/api/hard-delete-user', checkRoleAdmin,  async(req, res) => {
    const { email } = req.body;
    try {
        // Tìm và xóa người dùng theo email
        const user = await User.findOneAndDelete({ Email: email, IsDelete: true});

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng nào với email này' });
        }

        // Kiểm tra nếu người dùng có vai trò là 'Landlord'
        const role = await Role.findById(user.RoleID);
        if (role && role.RoleName === 'Landlord') {
            // Xóa dữ liệu Landlord nếu người dùng có vai trò là 'Landlord'
            await Landlord.findOneAndDelete({ Email: email });
        }

        // Nếu có hình ảnh thì xóa
        if (user.Image) {
            deleteImageUser(user.Image);
        }

        res.status(200).json({ message: 'Xóa người dùng và dữ liệu Landlord liên quan thành công', data: user });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


module.exports = router;