const express = require('express');
const router = express.Router();
const Images = require('../models/imagesModel');
const {Role} = require('../models/roleModel');
const User = require('../models/userModel');
const Motel = require('../models/motelModel');
const Room = require('../models/roomModel');
const { uploadImagesRoom, deleteImagesRoom } = require('../upload-image/uploadImgRoom');
const getCurrentDateFormatted = require('../getDate/getDateNow');


function deleteImages(images){
    images.map(image=> {
        deleteImagesRoom(image);
    });
}

//add new motel
router.post('/api/room', uploadImagesRoom, async (req, res) => {
    const { userID, motelID, description, convenient,floor, area, price } = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        // Kiểm tra xem ảnh có được upload không
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        const images = req.files.map(file => file.filename);

        // Kiểm tra xem motel có tồn tại không
        const existingMotel = await Motel.findById(motelID);
        if (!existingMotel) {
            deleteImages(images);
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Kiểm tra xem user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images);
            return res.status(404).json({ message: 'User does not exist!' });
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

        // Tạo mới đối tượng Room
        const newRoom = new Room({
            MotelID: existingMotel._id,
            Description: description,
            Floor: floor,
            Convenient: convenient,
            Area: area,
            Price: price,
            Status: false, 
            CreateAt: currentDate,
            CreateBy: userID,
        });

        // Lưu Room trước khi cập nhật ListImages
        const savedRoom = await newRoom.save();

        // Thêm ID của phòng vào danh sách ListRooms của Motel
        existingMotel.ListRooms.push(savedRoom._id);
        await existingMotel.save();

        // Lưu danh sách ảnh và gắn _id vào ListImages của Room
        const imageIDs = [];
        for (const image of images) {
            const newImage = new Images({
                RoomID: savedRoom._id, // Gắn RoomID vào ảnh
                LinkImage: image,
            });
            const savedImage = await newImage.save();
            imageIDs.push(savedImage._id); // Lưu lại _id của ảnh
        }

        // Cập nhật ListImages trong Room với danh sách các ImageIDs
        savedRoom.ListImages = imageIDs;
        await savedRoom.save();

        res.status(201).json({ message: 'Room created successfully', data: savedRoom });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

//delete room by id
router.delete('/api/room/:id', async (req, res) => {
    const id = req.params.id; 
    try {
        // Tìm room theo ID
        const existingRoom = await Room.findById(id); 
        if (!existingRoom) {
            return res.status(404).json({ message: 'Room does not exist!' });
        }

        // Tìm motel chứa room
        const existingMotel = await Motel.findById(existingRoom.MotelID);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Xóa room ID khỏi ListRooms của Motel
        existingMotel.ListRooms = existingMotel.ListRooms.filter(roomID => !roomID.equals(id));
        await existingMotel.save();

        // Xoá các ảnh liên quan đến room trước khi xoá room
        const imageIds = existingRoom.ListImages.map(id => id.toHexString());
        const imagesToDelete = await Promise.all(imageIds.map(async (id) => {
            const image = await Images.findById(id);
            return image ? image.LinkImage : null;
        }));

        if (imagesToDelete.length > 0) {
            deleteImages(imagesToDelete);
            await Images.deleteMany({ _id: { $in: imageIds } });
        }

        // Xoá room
        await Room.findByIdAndDelete(id);
        res.status(200).json({ message: 'Room deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;