const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const FavoriteMotel = require('../models/favoriteMotelModel');
const checkUser = require('../middleware/checkUser');


// get favorites list motel for user by id user
router.get('/api/favorite-motels', checkUser, async (req, res) => {
    try {
        const existingUser = req.user
        if(!existingUser){
            return res.status(404).json({ message: 'Người dùng không tồn tại.!' });
        }
        const existingFavoriteMotel = await FavoriteMotel.findOne({UserID: existingUser._id})
        .populate({
            path: 'ListMotels',
            populate: {
                path: 'ListImages', 
            }
        });

        if (!existingFavoriteMotel) {
            return res.status(404).json({ message: 'Nhà trọ yêu thích không tồn tại!' });
        }

        res.status(200).json({ message: 'Lấy danh sách nhà trọ yêu thích cho người dùng thành công', data: existingFavoriteMotel});

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

//add new motel into favorites list
router.post('/api/favorite-motel/:idMotel', checkUser, async (req, res) => {
    const idMotel = req.params.idMotel;
    try {
        const existingUser = req.user
        if(!existingUser){
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }
        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(idMotel);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Kiểm tra xem người dùng đã có danh sách yêu thích hay chưa
        let favoriteMotels = await FavoriteMotel.findOne({ UserID: existingUser._id });
        
        // Nếu chưa có, tạo mới danh sách yêu thích
        if (!favoriteMotels) {
            favoriteMotels = new FavoriteMotel({
                UserID: existingUser._id,
                ListMotels: [existingMotel._id]  // Thêm MotelID vào danh sách yêu thích
            });
        } else {
            // Nếu đã có, thêm motel vào danh sách yêu thích nếu chưa có
            if (!favoriteMotels.ListMotels.includes(idMotel)) {
                favoriteMotels.ListMotels.push(idMotel);
            } else {
                return res.status(400).json({ message: 'Nhà trọ đã có trong danh sách yêu thích!' });
            }
        }

        // Lưu danh sách yêu thích
        await favoriteMotels.save();
        const currentFavoriteMotels = await FavoriteMotel.findById(favoriteMotels._id).populate({
            path: 'ListMotels',
            populate: {
                path: 'ListImages',
            }
        });
        res.status(201).json({ message: 'Thêm nhà nhà trọ vào danh sách yêu thích thành công!', data: currentFavoriteMotels });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Remove a motel from the favorites list
router.delete('/api/favorite-motel/:idMotel', checkUser, async (req, res) => {
    const idMotel = req.params.idMotel;
    try {
        const existingUser = req.user;
        if (!existingUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        // Kiểm tra xem người dùng đã có danh sách yêu thích hay chưa
        const favoriteMotels = await FavoriteMotel.findOne({ UserID: existingUser._id });

        if (!favoriteMotels) {
            return res.status(404).json({ message: 'Danh sách yêu thích không tồn tại!' });
        }

        // Xóa nhà trọ khỏi danh sách yêu thích
        const motelIndex = favoriteMotels.ListMotels.indexOf(idMotel);
        if (motelIndex !== -1) {
            favoriteMotels.ListMotels.splice(motelIndex, 1); // Xóa phần tử khỏi mảng
        } else {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại trong danh sách yêu thích!' });
        }

        // Lưu lại danh sách yêu thích sau khi xóa
        await favoriteMotels.save();

        const currentFavoriteMotels = await FavoriteMotel.findById(favoriteMotels._id).populate({
            path: 'ListMotels',
            populate: {
                path: 'ListImages',
            }
        });
        res.status(200).json({ message: 'Xóa nhà trọ khỏi danh sách yêu thích thành công!', data: currentFavoriteMotels });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});




module.exports = router;