const express = require('express');
const router = express.Router();
const Images = require('../models/imagesModel');
const {Role} = require('../models/roleModel');
const User = require('../models/userModel');
const Landlord = require('../models/landlordModel');
const Motel = require('../models/motelModel');
const { uploadImagesMotel, deleteImagesMotel } = require('../upload-image/uploadImgMotel');
const getCurrentDateFormatted = require('../getDate/getDateNow');

function deleteImages(images){
    images.map(image=> {
        deleteImagesMotel(image);
    });
}

//add new motel
router.post('/api/motel', uploadImagesMotel, async (req, res) => {
    const { userID, landlordID, location, address, wardCommune, description, convenient, electricityBill, waterBill, wifiBill } = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }
        const images = req.files.map(file => file.filename);

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images);
            return res.status(404).json({ message: 'User does not exist!' });
        }

        // Kiểm tra user có quyền không
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

        // Kiểm tra Landlord có tồn tại không
        const existingLandlord = await Landlord.findById(landlordID);
        if (!existingLandlord) {
            deleteImages(images);
            return res.status(404).json({ message: 'Landlord does not exist!' });
        }

        if (!location) {
            deleteImages(images);
            return res.status(400).json({ message: 'Location does not exist!' });
        }

        // Tạo mới đối tượng Motel
        const newMotel = new Motel({
            Location: location,
            LandlordID: landlordID,
            Address: address,
            WardCommune: wardCommune,
            Description: description,
            Convenient: convenient,
            ElectricityBill: electricityBill,
            WaterBill: waterBill,
            WifiBill: wifiBill,
            CreateAt: currentDate,
            CreateBy: userID,
        });

        // Lưu Motel trước khi cập nhật ListImages
        const savedMotel = await newMotel.save();

        // Lưu danh sách ảnh và gắn _id vào ListImages của Motel
        const imageIDs = [];
        for (const image of images) {
            const newImage = new Images({
                MotelID: savedMotel._id,
                LinkImage: image,
            });
            const savedImage = await newImage.save();
            imageIDs.push(savedImage._id); // Lưu lại _id của ảnh
        }

        // Cập nhật ListImages trong Motel với danh sách các ImageIDs
        savedMotel.ListImages = imageIDs;
        await savedMotel.save();

        res.status(201).json({ message: 'Motel created successfully', data: savedMotel });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// update motel by ID
router.put('/api/motel/:id', uploadImagesMotel, async (req, res) => {
    const id  = req.params.id;
    const { userID, landlordID, location, address, wardCommune, description, convenient, electricityBill, waterBill, wifiBill } = req.body;
    const currentDate = getCurrentDateFormatted();
    try {
        const images = req.files.map(file => file.filename);
        // Tìm kiếm Motel theo ID
        const existingMotel = await Motel.findById(id);
        if (!existingMotel) {
            deleteImages(images);
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Kiểm tra user có tồn tại không
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

        // Kiểm tra landlord có tồn tại không
        const existingLandlord = await Landlord.findById(landlordID);
        if (!existingLandlord) {
            deleteImages(images);
            return res.status(404).json({ message: 'Landlord does not exist!' });
        }

        // Danh sách các trường có thể được cập nhật
        const fieldsToUpdate = {
            Location: location,
            LandlordID: landlordID,
            Address: address,
            WardCommune: wardCommune,
            Description: description,
            Convenient: convenient,
            ElectricityBill: electricityBill,
            WaterBill: waterBill,
            WifiBill: wifiBill
        };

        // Cập nhật các trường có giá trị mới
        Object.keys(fieldsToUpdate).forEach(key => {
            if (fieldsToUpdate[key] !== undefined) {
                existingMotel[key] = fieldsToUpdate[key];
            }
        });

        // Cập nhật thông tin ngày và người chỉnh sửa
        existingMotel.UpdateAt = currentDate;
        existingMotel.UpdateBy = userID;

        // Nếu có ảnh mới tải lên
        if (req.files && req.files.length > 0) {
            // Lưu danh sách ảnh mới vào cơ sở dữ liệu và cập nhật danh sách ảnh trong motel
            const imageIDs = [];
            for (const image of images) {
                const newImage = new Images({
                    MotelID: existingMotel._id,
                    LinkImage: image,
                });
                const savedImage = await newImage.save();
                imageIDs.push(savedImage._id);
            }

            // Xoá các ảnh cũ và cập nhật danh sách ảnh mới trong motel
            const oldImageIds = existingMotel.ListImages.map(id => id.toHexString());
            const oldImages = await Promise.all(oldImageIds.map(async (id) => {
                const image = await Images.findById(id);
                return image ? image.LinkImage : null;
            }));
            if (oldImages.length > 0) {
                deleteImages(oldImages); // Xóa ảnh cũ khỏi hệ thống tệp
                await Images.deleteMany({ _id: { $in: oldImageIds } }); // Xóa ảnh cũ khỏi database
            }
            // Cập nhật ListImages với danh sách ảnh mới
            existingMotel.ListImages = imageIDs;
        }

        // Lưu lại các thay đổi
        await existingMotel.save();

        res.status(200).json({ message: 'Motel updated successfully', data: existingMotel });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


//delete model by id
router.delete('/api/motel/:id', async (req, res) => {
    const id = req.params.id; 
    try {
        // Tìm motel theo ID
        const existingMotel = await Motel.findById(id); 
        if (!existingMotel) {
            return res.status(404).json({ message: 'Motel does not exist!' });
        }

        // Kiểm tra số lượng phòng trọ trong ListRooms
        if (existingMotel.ListRooms.length > 0) {
            return res.status(400).json({ message: 'The number of rooms in the motel must be 0 before deletion' });
        }

        // Xoá các ảnh liên quan đến motel trước khi xoá motel
        const imageIds = existingMotel.ListImages.map(id => id.toHexString());
        const imagesToDelete = await Promise.all(imageIds.map(async (id) => {
            const image = await Images.findById(id);
            return image ? image.LinkImage : null;
        }));

        if (imagesToDelete.length > 0) {
            deleteImages(imagesToDelete);
            await Images.deleteMany({ _id: { $in: imageIds } });
        }

        // Xoá motel
        await Motel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Motel deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



module.exports = router;