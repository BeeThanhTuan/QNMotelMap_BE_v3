const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const Rating = require('../models/ratingModel');
const getCurrentDateFormatted = require('../getDate/getDateNow');

//add new motel
router.post('/api/rating',  async (req, res) => {
    const { userID, motelID, star, comment} = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        console.log(req.body);
        
        // Kiểm tra xem user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist!' });
        }

        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        if(!star){
            return res.status(400).json({ message: 'Star is required!' });
        }

        if(!comment){
            return res.status(400).json({ message: 'Comment is required!' });
        }

        // Tạo mới đối tượng Rating
        const newRating = new Rating({
            MotelID: existingMotel._id,
            Star: star,
            Comment: comment,
            CreateAt: currentDate,
            CreateBy: existingUser._id,
        });

        const savedRating = await newRating.save();

        // Thêm ID của rating vào danh sách ListRatings của Motel
        existingMotel.ListRatings.push(savedRating._id);
        await existingMotel.save();


        res.status(201).json({ message: 'Rating created successfully', data: savedRating });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// get room by ID rom
router.get('/api/ratings/:idMotel', async (req, res) => {
    const id = req.params.idMotel;
    try {
        // Tìm Motel theo ID và chỉ lấy ListRatings
        const motel = await Motel.findById(id).populate({
            path: 'ListRatings',
            model: 'Rating'  
        });
        if (!motel) {
            return res.status(404).json({ message: 'Motel not found' });
        }

        // Tạo một bản sao của ListRatings và thêm Avatar từ CreateBy vào từng phần tử
        const ListRatings = await Promise.all(motel.ListRatings.map(async (rating) => {
            const user = await User.findById(rating.CreateBy).select('Image Username');
            return {
                ...rating.toObject(),   // Chuyển đổi đối tượng Mongoose sang JS object
                UserAvatar: user ? user.Image : null,
                UserName: user ? user.Username : null// Thêm trường UserAvatar
            };
        }));

        // Trả về danh sách đánh giá đã cập nhật kèm theo Avatar
        res.status(200).json({
            message: 'Get ratings by id motel successfully',
            data: { ListRatings}
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;