const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Images = require('../models/imagesModel');
const User = require('../models/userModel');
const Landlord = require('../models/landlordModel');
const { uploadImagesMotel, deleteImagesUMotel } = require('../upload-image/uploadImgMotel');
const getCurrentDateFormatted = require('../getDate/getDateNow');

router.post('/api/motel', uploadImagesMotel ,async (req, res) => {
    const { landlordID, address, description, userID} = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        const images = req.files.map(file => file.filename);

        // Kiểm tra user có tồn tại ko
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            images.array.forEach(image=> {
                deleteImageUser(image);
            });
            return res.status(400).json({ message: 'User not exists!' });
        }
        res.status(201).json({ message: 'Motel created successfully', data: existingUser });


        // Tạo mới đối tượng Motel
        // const newMotel = new Motel({
        //     LandlordID: landlordID,
        //     Address: address,
        //     Description: description,
        //     TotalRating: totalRating,
        //     CreateAt: currentDate,
        //     CreateBy: createBy
        // });

        // // Lưu Motel trước khi cập nhật ListImages
        // const savedMotel = await newMotel.save();

        // // Cập nhật MotelID trong các đối tượng Image
        // if (listImages && listImages.length > 0) {
        //     await Image.updateMany(
        //         { _id: { $in: listImages } },
        //         { MotelID: savedMotel._id }
        //     );
            
        //     // Cập nhật ListImages trong Motel
        //     savedMotel.ListImages = listImages;
        //     await savedMotel.save();
        // }

        // res.status(201).json({ message: 'Motel created successfully', data: savedMotel });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;