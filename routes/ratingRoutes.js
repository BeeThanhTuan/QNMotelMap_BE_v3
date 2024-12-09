const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const Rating = require('../models/ratingModel');
const getCurrentDateFormatted = require('../getDate/getDateNow');

//add new motel
router.post('/api/rating', async (req, res) => {
    const { userID, motelID, star, comment } = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        // Kiểm tra xem user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        if (!star) {
            return res.status(400).json({ message: 'Số sao không được để trống!' });
        }

        if (!comment) {
            return res.status(400).json({ message: 'Bình luận không được để trống!' });
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

        // Tính trung bình TotalRating
        const ratings = await Rating.find({ MotelID: motelID });
        const totalStars = ratings.reduce((sum, rating) => sum + rating.Star, 0);
        const averageStars = (totalStars / ratings.length).toFixed(1);

        // Cập nhật TotalRating của Motel
        existingMotel.TotalRating = averageStars;
        await existingMotel.save();

        // Thêm thông tin người dùng vào đối tượng đánh giá
        const ratingWithDataUser = {
            _id: savedRating._id,
            MotelID: savedRating.MotelID,
            Star: savedRating.Star,
            Comment: savedRating.Comment,
            CreateAt: savedRating.CreateAt,
            CreateBy: savedRating.CreateBy,
            UserAvatar: existingUser.Image || null,
            UserName: existingUser.Username || null,
        };

        res.status(201).json({ message: 'Đánh giá đã được tạo thành công!', data: ratingWithDataUser });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ!', error });
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

router.post('/api/rating/check', async (req, res) => {
    const { userID, motelID } = req.body;

    try {
        // Lấy thông tin nhà trọ
        const existingMotel = await Motel.findById(motelID).populate('ListRatings');
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Kiểm tra xem người dùng đã đánh giá hay chưa
        const hasRated = existingMotel.ListRatings.some((rating) => rating.CreateBy.toString() === userID);

        if (hasRated) {
            return res.status(200).json({ message: 'Người dùng đã đánh giá nhà trọ này.', hasRated: true });
        } else {
            return res.status(200).json({ message: 'Người dùng chưa đánh giá nhà trọ này.', hasRated: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ!', error });
    }
});



module.exports = router;