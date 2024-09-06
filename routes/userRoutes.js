const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Role} = require('../models/roleModel');
const User = require('../models/userModel');
const { uploadImageUser, deleteImageUser } = require('./uploadImgUser');
const getCurrentDateFormatted = require('../getDate/getDateNow');

// Get all users
router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-Password');; 
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }  
        res.status(200).json({ message: 'Get users success!', data: users });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// create new user
router.post('/api/user', uploadImageUser, async(req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const image = req.file ? req.file.filename : '';
    try {
        // check email exists
        const existingUser = await User.findOne({ Email: email });
        if (existingUser) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Email already exists!' });
        }

        if (!mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Invalid Role ID format' });
        }

        const role = await Role.findById(roleID);

        if (!role) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role unvalid!' });
        }
        const createDate = getCurrentDateFormatted();

        // create new
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

        // Save user 
        await newUser.save();
        res.status(201).json({ message: 'User created successfully!', data: newUser });


    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// update user by id
router.put('/api/user', uploadImageUser, async(req, res) => {
    const { username, email, password, phoneNumber, address, roleID } = req.body;
    const image = req.file ? req.file.filename : '';
    try {
        // check email exists
        const existingUser = await User.findOne({ Email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!' });
        }

        if (!mongoose.isValidObjectId(roleID)) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Invalid Role ID format' });
        }

        const role = await Role.findById(roleID);

        if (!role) {
            deleteImageUser(image);
            return res.status(400).json({ message: 'Role unvalid!' });
        }
        const createDate = getCurrentDateFormatted();

        // create new
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

        // Save user 
        await newUser.save();
        res.status(201).json({ message: 'User created successfully!', data: newUser });


    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;