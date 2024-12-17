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

// get all room type
router.get('/api/all-room-type', async (req, res) => {
    try {
        const roomTypes = await RoomType.find({IsDelete: false} )
        .populate('ListImages')
        .populate('ListConvenient')

        if (roomTypes.length <= 0) {
            return res.status(404).json({ message: 'Không tìm thấy loại phòng!' });
        }

        res.status(200).json({ message: 'Lấy tất cả loại phòng thành công!', data: roomTypes });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// get room by ID motel
router.get('/api/room-types/:idMotel', async (req, res) => {
    const id = req.params.idMotel;
    try {
        // Tìm room theo ID và populate các trường liên quan
        const existingMotel = await Motel.findOne({ _id: id, IsDelete: false })
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
        const existingRoomType = await RoomType.findOne({ _id: id, IsDelete: false })
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
            IsDelete: false,
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
        const allRooms = await RoomType.find({ MotelID: motelID , IsDelete: false });
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
        const allRooms = await RoomType.find({ MotelID: motelID, IsDelete: false });
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

// delete room type by ID (Soft Delete)
router.delete('/api/soft-delete-room-type/:id', checkRoleAdminAndLandlord, async (req, res) => {
    const id = req.params.id;
    const currentDate = getCurrentDateFormatted();

    try {
        const existingUser = req.user;
        // Kiểm tra sự tồn tại của loại phòng
        const existingRoomType = await RoomType.findOne({_id: id, IsDelete:false});
        if (!existingRoomType) {
            return res.status(404).json({ message: 'Loại phòng không tồn tại!' });
        }

        // Kiểm tra nhà trọ có tồn tại hay không
        const existingMotel = await Motel.findOne({_id:existingRoomType.MotelID, IsDelete:false});
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Cập nhật trạng thái IsDelete thành true
        existingRoomType.IsDelete = true;
        existingRoomType.UpdateAt = currentDate;
        existingRoomType.UpdateBy = existingUser._id;

        await existingRoomType.save();

        // Cập nhật giá thấp nhất và tiện nghi của nhà trọ
        const allRooms = await RoomType.find({ MotelID: existingMotel._id, IsDelete: false });
        const minPrice = allRooms.length > 0 ? Math.min(...allRooms.map(room => room.Price)) : 0;
        const totalAvailableRooms = allRooms.reduce((acc, roomType) => acc + roomType.Available, 0);

        existingMotel.Price = minPrice;
        existingMotel.TotalAvailableRoom = totalAvailableRooms;

        // Tổng hợp và cập nhật danh sách tiện ích của nhà trọ
        const allConveniences = allRooms.reduce((acc, room) => acc.concat(room.ListConvenient), []);
        const combinedConveniences = Array.from(
            new Set(allConveniences.map(id => id.toString()))
        ).map(id => new mongoose.Types.ObjectId(id));

        existingMotel.ListConvenient = combinedConveniences;
        await existingMotel.save();

        res.status(200).json({ message: 'Xoá mềm loại phòng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});


// Hard Delete Room Type by ID
router.delete('/api/hard-delete-room-type/:id', checkRoleAdminAndLandlord, async (req, res) => {
    const id = req.params.id;

    try {
        // Kiểm tra loại phòng có tồn tại và đã bị xóa mềm
        const existingRoomType = await RoomType.findOne({ _id: id, IsDelete: true });
        if (!existingRoomType) {
            return res.status(404).json({ message: 'Loại phòng không tồn tại hoặc chưa được xóa mềm!' });
        }

        // Xóa hoàn toàn loại phòng
        await RoomType.deleteOne({ _id: id });

        res.status(200).json({ message: 'Xóa hoàn toàn loại phòng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});

// Đếm tổng số lượng phòng và số phòng trống, bỏ qua các nhà trọ có IsDelete: true
router.get('/api/count-rooms', async (req, res) => {
    try {
        const roomSummary = await RoomType.aggregate([
            {
                $match: { IsDelete: { $ne: true } } 
            },
            {
                $group: {
                    _id: null,                       // Không nhóm theo trường nào cả
                    TotalRooms: { $sum: "$Amount" }, 
                    AvailableRooms: { $sum: "$Available" } 
                }
            },
            {
                $project: {
                    _id: 0,               // Ẩn trường _id
                    TotalRooms: 1,        // Tổng số lượng phòng
                    AvailableRooms: 1     // Tổng số phòng trống
                }
            }
        ]);

        res.status(200).json({
            message: 'Lấy tổng số lượng phòng và số phòng trống thành công',
            data: roomSummary[0] || { TotalRooms: 0, AvailableRooms: 0 } // Trả về mặc định nếu không có dữ liệu
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server',error});
    }
});



module.exports = router;