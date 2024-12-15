const express = require('express');
const router = express.Router();
const Convenient =  require('../models/convenientModel');
const { uploadImageConvenient, deleteImageConvenient } = require('../upload-image/uploadImgConvenient');
const checkRoleAdmin = require('../middleware/checkRoleAdmin');


// Lấy tất cả
router.get('/api/convenient', async (req, res) => {
    try {
        const convenient = await Convenient.find()

        if (convenient.length <= 0) {
            return res.status(404).json({ message: 'Không tìm thấy tiện ích nào!' });
        }
        res.status(200).json({ message: 'Lấy danh sách tiện ích thành công', data: convenient });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Thêm tiện ích mới
router.post('/api/convenient', checkRoleAdmin, uploadImageConvenient, async (req, res) => {
    const { nameConvenient } = req.body;
    const image = req.file ? req.file.filename : '';
    try {
        if (!image) {
            deleteImageConvenient(image);
            return res.status(400).json({ message: 'Ảnh là bắt buộc!' });
        }
        // Kiểm tra tiện ích đã tồn tại hay chưa
        const existingConvenient = await Convenient.findOne({ NameConvenient: nameConvenient });
        if (existingConvenient) {
            deleteImageConvenient(image);
            return res.status(400).json({ message: 'Tiện ích đã tồn tại!' });
        }

        const newConvenient = new Convenient({
            NameConvenient: nameConvenient,
            LinkImage: image,
        });
        await newConvenient.save();
        res.status(201).json({ message: 'Tạo tiện ích thành công!', data: newConvenient });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Cập nhật tiện ích theo ID
router.put('/api/convenient/:id', checkRoleAdmin, uploadImageConvenient, async (req, res) => {
    const { nameConvenient } = req.body;
    const id = req.params.id;
    const newImage = req.file ? req.file.filename : '';

    try {
        // Kiểm tra tiện ích đã tồn tại hay chưa
        const existingConvenient = await Convenient.findById(id);
        if (!existingConvenient) {
            if (newImage) {
                deleteImageConvenient(newImage);
            }
            return res.status(404).json({ message: 'Không tìm thấy tiện ích!' });
        }

         // Xóa ảnh cũ nếu có ảnh mới
         if (newImage && existingConvenient.LinkImage) {
            deleteImageConvenient(existingConvenient.LinkImage);
        }

        const existingNameConvenient = await Convenient.findOne({ NameConvenient: nameConvenient });
        if (existingNameConvenient) {
            if (newImage) {
                deleteImageConvenient(newImage);
            }
            return res.status(400).json({ message: 'Tên tiện ích đã tồn tại!' });
        }

        // Cập nhật tiện ích
        if (nameConvenient) existingConvenient.NameConvenient = nameConvenient;
        if (newImage) existingConvenient.LinkImage = newImage;

        await existingConvenient.save();

        res.status(201).json({ message: 'Cập nhật tiện ích thành công!', data: existingConvenient });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});



module.exports = router;