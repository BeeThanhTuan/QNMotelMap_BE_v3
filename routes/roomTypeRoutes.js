const express = require('express');
const router = express.Router();
const Images = require('../models/imagesModel');
const {Role} = require('../models/roleModel');
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
    const currentDate = getCurrentDateFormatted();

    const images = req.files.map(file => file.filename);
    try {
        // Kiểm tra xem đã tải lên ảnh chưa
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Chưa có ảnh được tải lên' });
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

        // Tạo mới đối tượng RoomType
        const newRoomType = new RoomType({
            MotelID: existingMotel._id,
            Description: description,
            ListConvenient: listConvenient,
            Area: area,
            Price: price,
            Amount: amount,
            Available: available,
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
        for (const image of images) {
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
        console.log(totalAvailableRooms);
        
        existingMotel.TotalAvailableRoom = totalAvailableRooms;

        // Lưu thông tin nhà trọ sau khi cập nhật
        await existingMotel.save();

        res.status(201).json({ message: 'Thêm loại phòng thành công', data: savedRoomType });
    } catch (error) {
        deleteImages(images);
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});



// update room type by ID
router.put('/api/room-type/:idRoomType', checkRoleAdminAndLandlord, uploadImagesRoom, async (req, res) => {
    const id  = req.params.idRoomType;
    const { userID, description, listConvenient, floor, amount, area, price, available } = req.body;
    const currentDate = getCurrentDateFormatted();
    const images = req.files.map(file => file.filename);
    try {
        // Tìm kiếm RoomType theo ID
        const existingRoomType = await RoomType.findById(id);
        if (!existingRoomType) {
            deleteImages(images);
            return res.status(404).json({ message: 'Room type does not exist!' });
        }

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images);
            return res.status(404).json({ message: 'User does not exist!' });
        }

        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(existingRoomType.MotelID);
        if (!existingMotel) {
            deleteImages(images);
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Danh sách các trường có thể được cập nhật
        const fieldsToUpdate = {
            Description: description,
            Floor: floor,
            Area: area,
            ListConvenient: listConvenient,
            Price: price,
            Amount: amount, 
            Available: available
        };

        // Cập nhật các trường có giá trị mới
        Object.keys(fieldsToUpdate).forEach(key => {
            if (fieldsToUpdate[key] !== undefined) {
                existingRoomType[key] = fieldsToUpdate[key];
            }
        });

        // Cập nhật thông tin ngày và người chỉnh sửa
        existingRoomType.UpdateAt = currentDate;
        existingRoomType.UpdateBy = existingUser._id;

        // Nếu có ảnh mới tải lên
        if (req.files && req.files.length > 0) {
            // Lưu danh sách ảnh mới vào cơ sở dữ liệu và cập nhật danh sách ảnh trong room
            const imageIDs = [];
            for (const image of images) {
                const newImage = new Images({
                    RoomID: existingRoomType._id,
                    LinkImage: image,
                });
                const savedImage = await newImage.save();
                imageIDs.push(savedImage._id);
            }

            // Xoá các ảnh cũ và cập nhật danh sách ảnh mới trong motel
            const oldImageIds = existingRoomType.ListImages.map(id => id.toHexString());
            const oldImages = await Promise.all(oldImageIds.map(async (id) => {
                const image = await Images.findById(id);
                return image ? image.LinkImage : null;
            }));
            if (oldImages.length > 0) {
                deleteImages(oldImages); // Xóa ảnh cũ khỏi hệ thống tệp
                await Images.deleteMany({ _id: { $in: oldImageIds } }); // Xóa ảnh cũ khỏi database
            }
            // Cập nhật ListImages với danh sách ảnh mới
            existingRoomType.ListImages = imageIDs;
        }

        // Lưu lại các thay đổi
        await existingRoomType.save();

        // Update motel's price
        const allRooms = await RoomType.find({ MotelID: existingMotel._id });

        const minPrice = allRooms.length > 0 ? Math.min(...allRooms.map(room => room.Price)) : price;
        existingMotel.Price = minPrice;

        // Collect all conveniences from all room types
        const allConveniences = allRooms.reduce((acc, room) => {
            return acc.concat(room.ListConvenient);
        }, []);

        // Combine with motel's current ListConvenient and deduplicate
        const combinedConveniences = Array.from(
            new Set([...existingMotel.ListConvenient, ...allConveniences].map(id => id.toString()))
        ).map(id => new ObjectId(id));
        
        // Update motel's ListConvenient
        existingMotel.ListConvenient = combinedConveniences;
        await existingMotel.save();

        res.status(200).json({ message: 'Room updated successfully', data: existingRoomType });
    } catch (error) {
        deleteImages(images);
        res.status(500).json({ message: 'Server error', error });
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