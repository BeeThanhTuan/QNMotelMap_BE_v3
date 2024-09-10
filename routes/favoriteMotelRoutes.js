const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const FavoriteMotel = require('../models/favoriteMotelModel');


// get favorites list motel for user by id user
router.get('/api/favorite/:id', async (req, res) => {
    const userID = req.params.id;
    try {
        const existingFavoriteMotel = await FavoriteMotel.findOne({UserID: userID})
            .populate('ListMotels')

        if (!existingFavoriteMotel) {
            return res.status(404).json({ message: 'Favorites motel does not exist!' });
        }

        res.status(200).json({ message: 'Get favorites list motel for user successfully', data: existingFavoriteMotel});

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
//add new motel into favorites list
router.post('/api/favorite', async (req, res) => {
    const { userID, motelID } = req.body;
    
    try {
        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Motel does not exist!' });
        }


        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist!' });
        }

        // Kiểm tra xem người dùng đã có danh sách yêu thích hay chưa
        let favoriteMotel = await FavoriteMotel.findOne({ UserID: userID });
        
        // Nếu chưa có, tạo mới danh sách yêu thích
        if (!favoriteMotel) {
            favoriteMotel = new FavoriteMotel({
                UserID: existingUser._id,
                ListMotels: [existingMotel._id]  // Thêm MotelID vào danh sách yêu thích
            });
        } else {
            // Nếu đã có, thêm motel vào danh sách yêu thích nếu chưa có
            if (!favoriteMotel.ListMotels.includes(motelID)) {
                favoriteMotel.ListMotels.push(motelID);
            } else {
                return res.status(400).json({ message: 'Motel is already in the favorite list!' });
            }
        }

        // Lưu danh sách yêu thích
        await favoriteMotel.save();
        res.status(201).json({ message: 'Add motel into favorite list success!', data: favoriteMotel });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

//remove the motel from your favorites list by id
router.delete('/api/favorite', async (req, res) => {
    const { userID, motelID } = req.body;
    
    try {
        // Kiểm tra xem danh sách yêu thích của người dùng có tồn tại không
        const existingFavoriteMotel = await FavoriteMotel.findOne({ UserID: userID });
        if (!existingFavoriteMotel) {
            return res.status(404).json({ message: 'Favorite list does not exist!' });
        }

        // Kiểm tra xem motel có tồn tại trong danh sách yêu thích không
        if (!existingFavoriteMotel.ListMotels.includes(motelID)) {
            return res.status(404).json({ message: 'Motel is not in the favorite list!' });
        }

        // Xóa nhà trọ khỏi danh sách yêu thích
        existingFavoriteMotel.ListMotels = existingFavoriteMotel.ListMotels.filter(motel => motel.toString() !== motelID);

        // Lưu lại thay đổi
        await existingFavoriteMotel.save();

        res.status(200).json({ message: 'Motel removed from favorite list successfully', data: existingFavoriteMotel });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



module.exports = router;