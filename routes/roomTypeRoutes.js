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

function deleteImages(images){
    images.map(image=> {
        deleteImagesRoom(image);
    });
}

// get room by ID motel
router.get('/api/roomTypes/:idMotel', async (req, res) => {
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
            options: { sort: { Floor: 1 } }
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
router.get('/api/roomType/:idRoomType', async (req, res) => {
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
router.post('/api/roomType', uploadImagesRoom, async (req, res) => {
    const { userID, motelID, description, listConvenient, floor, area, price, amount, available } = req.body;
    const currentDate = getCurrentDateFormatted();

    try {
        // Check if images are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        const images = req.files.map(file => file.filename);

        // Verify motel existence
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            deleteImages(images);
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Verify user existence
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images);
            return res.status(404).json({ message: 'User does not exist!' });
        }

        // Check user role
        const role = await Role.findById(existingUser.RoleID);
        if (!role || (role.RoleName !== 'Admin' && role.RoleName !== 'Landlord')) {
            deleteImages(images);
            return res.status(400).json({ message: 'Role not authorized!' });
        }

        // Create new RoomType object
        const newRoomType = new RoomType({
            MotelID: existingMotel._id,
            Description: description,
            Floor: floor,
            ListConvenient: listConvenient,
            Area: area,
            Price: price,
            Amount: amount,
            Available: available,
            CreateAt: currentDate,
            CreateBy: userID,
        });

        // Save new RoomType
        const savedRoomType = await newRoomType.save();

        // Add room ID to motel's ListRoomTypes
        existingMotel.ListRoomTypes = existingMotel.ListRoomTypes || [];
        existingMotel.ListRoomTypes.push(savedRoomType._id);
        await existingMotel.save();

        // Save image references
        const imageIDs = [];
        for (const image of images) {
            const newImage = new Images({
                RoomID: savedRoomType._id,
                LinkImage: image,
            });
            const savedImage = await newImage.save();
            imageIDs.push(savedImage._id);
        }

        // Update savedRoomType with image IDs
        savedRoomType.ListImages = imageIDs;
        await savedRoomType.save();

        // Update motel's price
        const allRooms = await RoomType.find({ MotelID: motelID });
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

        res.status(201).json({ message: 'Room created successfully', data: savedRoomType });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



// update room type by ID
router.put('/api/roomType/:idRoomType', uploadImagesRoom, async (req, res) => {
    const id  = req.params.idRoomType;
    const { userID, description, listConvenient, floor, amount, area, price, available } = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        const images = req.files.map(file => file.filename);
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

        // Kiểm tra quyền của user
        const role = await Role.findById(existingUser.RoleID);
        if (role) {
            if (role.RoleName !== 'Admin' && role.RoleName !== 'Landlord') {
                deleteImages(images);
                return res.status(400).json({ message: 'Role no access!' });
            }
        } else {
            deleteImages(images);
            return res.status(400).json({ message: 'Role not valid!' });
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
        res.status(500).json({ message: 'Server error', error });
    }
});

//delete room by id
router.delete('/api/roomType/:idRoomType', async (req, res) => {
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