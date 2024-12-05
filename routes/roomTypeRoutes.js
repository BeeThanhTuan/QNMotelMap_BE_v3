const express = require('express');
const router = express.Router();
const Images = require('../models/imagesModel');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const RoomType = require('../models/roomTypeModel');
const { uploadImagesRoom, deleteImagesRoom } = require('../upload-image/uploadImgRoom');
const getCurrentDateFormatted = require('../getDate/getDateNow');
const { ObjectId } = require('mongodb');
const checkRoleAdminAndLandlord = require('../middleware/checkRoleAdminAndLandlord')

function deleteImages(images){
    images.map(image=> {
        deleteImagesRoom(image);
    });
}

// get room by ID motel
router.get('/api/room-types/:idMotel', async (req, res) => {
    const id = req.params.idMotel;
    try {
        // Tìm room theo ID và populate các trường liên quan
        const existingMotel = await Motel.findById(id)
        .populate({
            path: 'ListRoomTypes', // Populate the ListRoomTypes field
            populate: [
                { path: 'ListImages' },       
                { path: 'ListConvenient'}
            ],
        });

        if (!existingMotel) {
            return res.status(404).json({ message: 'Room type does not exist!' });
        }

        res.status(200).json({ message: 'Get room type by id successfully', data: existingMotel.ListRoomTypes });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// get room by ID rom
router.get('/api/room-type/:idRoomType', async (req, res) => {
    const id = req.params.idRoomType;
    try {
        // Tìm room type theo ID và populate các trường liên quan
        const existingRoomType = await RoomType.findById(id)
            .populate('ListImages')
            .populate('ListConvenient')

        if (!existingRoomType) {
            return res.status(404).json({ message: 'Room type does not exist!' });
        }

        res.status(200).json({ message: 'Get room type by id successfully', data: existingRoomType });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// add new room type
router.post('/api/room-type', checkRoleAdminAndLandlord, uploadImagesRoom, async (req, res) => {
    const { userID, motelID, description, listConvenient, area, price, amount, available } = req.body;
    const transformedData = {
        listConvenient: JSON.parse(listConvenient || '[]'), 
        area: Number(area) || 0,
        price: Number(price) || 0,
        amount:Number(amount) || 0,
        available:Number(available) || 0
    };
    const currentDate = getCurrentDateFormatted();
    const listImages = req.files.map(file => file.filename);
    
    try {
        // Kiểm tra xem đã tải lên ảnh chưa
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Chưa có ảnh được tải lên' });
        }

        // Kiểm tra nhà trọ có tồn tại hay không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            deleteImages(listImages);
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Kiểm tra người dùng có tồn tại hay không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(listImages);
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        // Tạo mới đối tượng RoomType
        const newRoomType = new RoomType({
            MotelID: existingMotel._id,
            Description: description,
            ListConvenient: transformedData.listConvenient,
            Area: transformedData.area,
            Price: transformedData.price,
            Amount: transformedData.amount,
            Available: transformedData.available,
            CreateAt: currentDate,
            CreateBy: userID,
        });

        // Lưu RoomType mới
        const savedRoomType = await newRoomType.save();

        // Thêm ID loại phòng vào danh sách ListRoomTypes của nhà trọ
        existingMotel.ListRoomTypes = existingMotel.ListRoomTypes || [];
        existingMotel.ListRoomTypes.push(savedRoomType._id);
        await existingMotel.save();

        // Lưu thông tin ảnh
        const imageIDs = [];
        for (const image of listImages) {
            const newImage = new Images({
                RoomID: savedRoomType._id,
                LinkImage: image,
            });
            const savedImage = await newImage.save();
            imageIDs.push(savedImage._id);
        }

        // Cập nhật danh sách ảnh cho RoomType
        savedRoomType.ListImages = imageIDs;
        await savedRoomType.save();

        // Cập nhật giá thấp nhất của nhà trọ
        const allRooms = await RoomType.find({ MotelID: motelID });
        const minPrice = allRooms.length > 0 ? Math.min(...allRooms.map(room => room.Price)) : price;
        existingMotel.Price = minPrice;

        // Tổng hợp tất cả tiện ích từ các loại phòng
        const allConveniences = allRooms.reduce((acc, room) => {
            return acc.concat(room.ListConvenient);
        }, []);

        // Kết hợp với danh sách tiện ích hiện tại của nhà trọ và loại bỏ trùng lặp
        const combinedConveniences = Array.from(
            new Set([...existingMotel.ListConvenient, ...allConveniences].map(id => id.toString()))
        ).map(id => new ObjectId(id));

        // Cập nhật danh sách tiện ích của nhà trọ
        existingMotel.ListConvenient = combinedConveniences;

        // **Tính tổng số phòng trống**
        const totalAvailableRooms = allRooms.reduce((acc, roomType) => acc + roomType.Available, 0); 
        existingMotel.TotalAvailableRoom = totalAvailableRooms;

        // Lưu thông tin nhà trọ sau khi cập nhật
        await existingMotel.save();
        const populatedRoomType = await RoomType.findById(savedRoomType._id).populate('ListImages').populate('ListConvenient');

        res.status(201).json({ message: 'Thêm loại phòng thành công', data: populatedRoomType });
    } catch (error) {
        deleteImages(listImages);
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});


// Update room type by ID
router.put('/api/room-type/:id', checkRoleAdminAndLandlord, uploadImagesRoom, async (req, res) => {
    const id = req.params.id;
    const {
        userID, motelID, description, listConvenient, area, price, amount, available, listOldImagesRemove
    } = req.body;

    const transformedData = {
        listConvenient: JSON.parse(listConvenient || '[]'),
        listOldImagesRemove: JSON.parse(listOldImagesRemove || '[]'),
        area: Number(area) || 0,
        price: Number(price) || 0,
        amount: Number(amount) || 0,
        available: Number(available) || 0
    };

    const currentDate = getCurrentDateFormatted();
    const images = req.files ? req.files.map(file => file.filename) : [];

    try {
        // Kiểm tra sự tồn tại của loại phòng
        const existingRoomType = await RoomType.findById(id);
        if (!existingRoomType) {
            deleteImages(images);
            return res.status(404).json({ message: 'Loại phòng không tồn tại!' });
        }

        // Kiểm tra nhà trọ có tồn tại hay không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            deleteImages(images);
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Kiểm tra người dùng có tồn tại hay không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images);
            return res.status(404).json({ message: 'Người dùng không tồn tại!' });
        }

        // Các trường cần cập nhật
        const fieldsToUpdate = {
            Description: description ,
            ListConvenient: transformedData.listConvenient,
            Area: transformedData.area,
            Price: transformedData.price,
            Amount: transformedData.amount,
            Available: transformedData.available,
            UpdateAt: currentDate,
            UpdateBy: userID
        };


        // Áp dụng các trường cần cập nhật vào existingRoomType
        Object.keys(fieldsToUpdate).forEach(key => {
            if (fieldsToUpdate[key] || fieldsToUpdate[key] === false || fieldsToUpdate[key] === 0) {
                existingRoomType[key] = fieldsToUpdate[key];
            }
        });

        // Xóa ảnh cũ nếu được chỉ định
        if (transformedData.listOldImagesRemove.length > 0) {
            const imageIdsToRemove = transformedData.listOldImagesRemove.map(id => new mongoose.Types.ObjectId(id));
            const imagesToDelete = await Images.find({ _id: { $in: imageIdsToRemove } });
            const imagesToDeletePaths = imagesToDelete.map(image => image.LinkImage);

            deleteImages(imagesToDeletePaths); // Xóa ảnh trên file system
            await Images.deleteMany({ _id: { $in: imageIdsToRemove } }); // Xóa ảnh trong database

            // Loại bỏ các ảnh đã xóa khỏi danh sách ảnh của RoomType
            existingRoomType.ListImages = existingRoomType.ListImages.filter(imageId => 
                !imageIdsToRemove.includes(imageId.toString())
            );
        }

        // Thêm ảnh mới
        if (images.length > 0) {
            const imageIDs = [];
            for (const image of images) {
                const newImage = new Images({
                    RoomID: existingRoomType._id,
                    LinkImage: image,
                });
                const savedImage = await newImage.save();
                imageIDs.push(savedImage._id);
            }
            existingRoomType.ListImages.push(...imageIDs);
        }

        // Lưu thông tin RoomType sau khi cập nhật
        await existingRoomType.save();

        // Cập nhật giá thấp nhất và số phòng trống của nhà trọ
        const allRooms = await RoomType.find({ MotelID: motelID });
        const minPrice = allRooms.length > 0 ? Math.min(...allRooms.map(room => room.Price)) : transformedData.price;
        const totalAvailableRooms = allRooms.reduce((acc, roomType) => acc + roomType.Available, 0);

        existingMotel.Price = minPrice;
        existingMotel.TotalAvailableRoom = totalAvailableRooms;

        // Tổng hợp và cập nhật danh sách tiện ích của nhà trọ
        const allConveniences = allRooms.reduce((acc, room) => acc.concat(room.ListConvenient), []);
        const combinedConveniences = Array.from(
            new Set([...existingMotel.ListConvenient, ...allConveniences].map(id => id.toString()))
        ).map(id => new mongoose.Types.ObjectId(id));

        existingMotel.ListConvenient = combinedConveniences;
        await existingMotel.save();

        const populatedRoomType = await RoomType.findById(existingRoomType._id).populate('ListImages').populate('ListConvenient');

        res.status(200).json({ message: 'Cập nhật loại phòng thành công', data: populatedRoomType });
    } catch (error) {
        deleteImages(images);
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});


//delete room by id
router.delete('/api/room-type/:idRoomType', async (req, res) => {
    const id = req.params.idRoomType; 
    try {
        // Tìm room theo ID
        const existingRoomType = await RoomType.findById(id); 
        if (!existingRoomType) {
            return res.status(404).json({ message: 'Room type does not exist!' });
        }

        // Tìm motel chứa room
        const existingMotel = await Motel.findById(existingRoomType.MotelID);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Xóa room ID khỏi ListRooms của Motel
        existingMotel.ListRoomTypes = existingMotel.ListRoomTypes.filter(roomID => !roomID.equals(id));
        await existingMotel.save();

        // Xoá các ảnh liên quan đến room trước khi xoá room
        const imageIds = existingRoomType.ListImages.map(id => id.toHexString());
        const imagesToDelete = await Promise.all(imageIds.map(async (id) => {
            const image = await Images.findById(id);
            return image ? image.LinkImage : null;
        }));

        if (imagesToDelete.length > 0) {
            deleteImages(imagesToDelete);
            await Images.deleteMany({ _id: { $in: imageIds } });
        }

        // Xoá room
        await RoomType.findByIdAndDelete(id);
        res.status(200).json({ message: 'Room type deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;