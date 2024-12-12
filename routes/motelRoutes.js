const express = require('express');
const router = express.Router();
const Images = require('../models/imagesModel');
const User = require('../models/userModel');
const Landlord = require('../models/landlordModel');
const Motel = require('../models/motelModel');
const RoomType = require('../models/roomTypeModel');
const mongoose = require('mongoose');
const { uploadImagesMotel, deleteImagesMotel } = require('../upload-image/uploadImgMotel');
const getCurrentDateFormatted = require('../getDate/getDateNow');
const getMotelDataFilter = require('../filterData/motelFilter')
const checkRoleAdminAndLandlord = require('../middleware/checkRoleAdminAndLandlord');

function deleteImages(images) {
    images.map(image => {
        deleteImagesMotel(image);
    });
}

router.get('/api/motels', async(req, res) => {
    try {
        // Lấy danh sách tất cả các motels
        const motels = await Motel.find({ IsDelete: false })
            .populate('ListImages')
            .populate('ListRatings')
            .populate('ListConvenient')
        if (motels.length <= 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhà trọ!' });
        }

        const motelsFiltered = getMotelDataFilter(motels);
        res.status(200).json({
            message: 'Lất tất cả nhà trọ thành công.',
            data: motels, // Trả về dữ liệu đã có totalStar
            dataFiltered: motelsFiltered
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


// Get motel by ID
router.get('/api/motel/:id', async(req, res) => {
    const id = req.params.id;
    try {
        const existingMotel = await Motel.findOne({ _id: id })
            .populate('ListImages')
            .populate('ListRoomTypes')
            .populate('ListRatings')
            .populate('ListConvenient')

        if (!existingMotel) {
            return res.status(404).json({ message: 'nhà trọ không tồn tại!' });
        }

        res.status(200).json({ message: 'Lấy nhà trọ theo id thành công!', data: existingMotel });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});


//add new motel
router.post('/api/motel', uploadImagesMotel, checkRoleAdminAndLandlord, async(req, res) => {
    const {
        userID,
        nameMotel,
        landlordID,
        location,
        address,
        wardCommune,
        description,
        listConvenient,
        electricityBill,
        waterBill,
        wifiBill,
        distance,
        price,
        liveWithLandlord,
        landlordName,
        phoneNumberContact,
        addressLandlord
    } = req.body;
    const transformedData = {
        userID,
        nameMotel,
        landlordID,
        location,
        address,
        wardCommune,
        description,
        listConvenient: JSON.parse(listConvenient || '[]'),
        electricityBill: Number(electricityBill) || 0,
        waterBill: Number(waterBill) || 0,
        wifiBill: wifiBill === 'null' ? null : Number(wifiBill) || 0,
        distance: parseFloat(distance) || 0,
        price: Number(price) || 0,
        liveWithLandlord: liveWithLandlord === 'true',
        landlordName,
        phoneNumberContact,
        addressLandlord,
    };

    const currentDate = getCurrentDateFormatted();


    const listImages = req.files.map(file => file.filename);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Không có ảnh tải lên!' });
        }

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(listImages);
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        if (!location) {
            deleteImages(listImages);
            return res.status(400).json({ message: 'Chưa có vị trí chính xác của nhà trọ.' });
        }

        if (!distance) {
            deleteImages(listImages);
            return res.status(400).json({ message: 'Chưa có khoảng cách tới trường.' });
        }

        // Tạo mới đối tượng Motel
        const newMotel = new Motel({
            NameMotel: nameMotel,
            Location: location,
            LandlordID: landlordID,
            Address: address,
            WardCommune: wardCommune,
            Description: description,
            ListConvenient: transformedData.listConvenient,
            Distance: transformedData.distance,
            Price: transformedData.price,
            LiveWithLandlord: !transformedData.liveWithLandlord,
            ElectricityBill: transformedData.electricityBill,
            WaterBill: transformedData.waterBill,
            WifiBill: transformedData.wifiBill,
            TotalRating: 0,
            TotalAvailableRoom: 0,
            LandlordName: landlordName,
            AddressLandlord: addressLandlord,
            PhoneNumberContact: phoneNumberContact,
            CreateAt: currentDate,
            CreateBy: userID,
            IsDelete: false,
        });

        // Lưu Motel trước khi cập nhật ListImages
        const savedMotel = await newMotel.save();

        // Lưu danh sách ảnh và gắn _id vào ListImages của Motel
        const imageIDs = [];
        for (const image of listImages) {
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

        if (landlordID) {
            // Cập nhật ListMotel trong Landlord với _id của Motel vừa được tạo
            await Landlord.findByIdAndUpdate(
                landlordID, { $push: { ListMotels: savedMotel._id } }, // Thêm mới vào ListMotel của Landlord
                { new: true }
            );
        }

        const populatedMotel = await Motel.findById(savedMotel._id).populate('ListImages').populate('ListConvenient');

        res.status(201).json({ message: 'Thêm thành công nhà trọ mới.', data: populatedMotel });
    } catch (error) {
        deleteImages(listImages);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});



// update motel by ID
router.put('/api/motel/:id', uploadImagesMotel, checkRoleAdminAndLandlord, async(req, res) => {
    const id = req.params.id;
    const {
        userID,
        landlordID,
        location,
        address,
        wardCommune,
        description,
        listConvenient,
        listOldImagesRemove,
        electricityBill,
        waterBill,
        wifiBill,
        liveWithLandlord,
        landlordName,
        phoneNumberContact,
        addressLandlord,
        distance,
        price,
        nameMotel
    } = req.body;

    const transformedData = {
        userID,
        nameMotel,
        landlordID,
        location,
        address,
        wardCommune,
        description,
        listConvenient: JSON.parse(listConvenient || '[]'),
        listOldImagesRemove: JSON.parse(listOldImagesRemove || '[]'),
        electricityBill: Number(electricityBill) || 0,
        waterBill: Number(waterBill) || 0,
        wifiBill: wifiBill === 'null' ? null : Number(wifiBill) || 0,
        distance: parseFloat(distance) || 0,
        price: Number(price) || 0,
        liveWithLandlord: liveWithLandlord === 'true',
        landlordName,
        phoneNumberContact,
        addressLandlord,
    };

    const currentDate = getCurrentDateFormatted();

    const images = req.files ? req.files.map(file => file.filename) : [];
    try {

        // Tìm nhà trọ hiện tại theo ID
        const existingMotel = await Motel.findById(id);
        if (!existingMotel) {
            deleteImages(images); // Xóa ảnh đã tải lên nếu không tìm thấy nhà trọ
            return res.status(404).json({ message: 'Không tìm thấy nhà trọ cần cập nhật!' });
        }

        // Kiểm tra sự tồn tại của người dùng
        const existingUser = await User.findById(userID);
        if (!existingUser) {
            deleteImages(images); // Xóa ảnh đã tải lên nếu không tìm thấy người dùng
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }


        // Các trường cần cập nhật
        const fieldsToUpdate = {
            NameMotel: nameMotel,
            Location: location,
            LandlordID: landlordID,
            Address: address,
            WardCommune: wardCommune,
            Description: description,
            ListConvenient: transformedData.listConvenient,
            ElectricityBill: transformedData.electricityBill,
            Distance: transformedData.distance,
            WaterBill: transformedData.waterBill,
            WifiBill: transformedData.wifiBill,
            LiveWithLandlord: !transformedData.liveWithLandlord,
            LandlordName: landlordName,
            PhoneNumberContact: phoneNumberContact,
            AddressLandlord: addressLandlord,
            Price: transformedData.price,
        };

        // Cập nhật các trường
        Object.keys(fieldsToUpdate).forEach(key => {
            if (fieldsToUpdate[key] || fieldsToUpdate[key] === false || fieldsToUpdate[key] === 0) {
                existingMotel[key] = fieldsToUpdate[key];
            }
        });

        if (transformedData.wifiBill === null) {
            existingMotel.WifiBill = null;
        }
        // Cập nhật ngày chỉnh sửa và người chỉnh sửa
        existingMotel.UpdateAt = currentDate;
        existingMotel.UpdateBy = userID;

        // Xóa ảnh cũ
        if (transformedData.listOldImagesRemove && transformedData.listOldImagesRemove.length > 0) {
            try {
                const imageIdsToRemove = transformedData.listOldImagesRemove.map(id => new mongoose.Types.ObjectId(id)); // Chuyển chuỗi thành ObjectId đúng cách
                const remainingImages = existingMotel.ListImages.filter(imageId => !imageIdsToRemove.includes(imageId.toString()));
                // Truy vấn ảnh để xóa
                const imagesToDelete = await Images.find({ _id: { $in: imageIdsToRemove } }); // Sử dụng ObjectId

                if (imagesToDelete.length === 0) {
                    console.log("Không tìm thấy ảnh cần xóa.");
                }
                // Xóa ảnh khỏi thư mục và database
                const imagesToDeletePaths = imagesToDelete.map(image => image.LinkImage);
                deleteImages(imagesToDeletePaths); // Xóa ảnh trên file system
                await Images.deleteMany({ _id: { $in: imageIdsToRemove } }); // Xóa ảnh trong database

                // Cập nhật lại ListImages sau khi xóa ảnh cũ
                existingMotel.ListImages = remainingImages;

            } catch (error) {
                console.error("Đã xảy ra lỗi:", error); // In lỗi nếu có
            }
        }

        // Thêm ảnh mới
        if (images.length > 0) {
            const imageIDs = [];
            for (const image of images) {
                const newImage = new Images({
                    MotelID: existingMotel._id,
                    LinkImage: image,
                });
                const savedImage = await newImage.save();
                imageIDs.push(savedImage._id);
            }

            // Cập nhật lại ListImages, chỉ thêm các ảnh mới vào
            existingMotel.ListImages.push(...imageIDs);

            // Lưu lại mảng ListImages trong Motel
            await existingMotel.save();
        }

        // Đảm bảo cập nhật xong tất cả dữ liệu
        await existingMotel.save();

        // Đảm bảo response trả về dữ liệu chính xác
        const updatedMotel = await Motel.findById(existingMotel._id).populate('ListImages').populate('ListConvenient');
        res.status(200).json({
            message: 'Cập nhật nhà trọ thành công',
            data: updatedMotel
        });
    } catch (error) {
        deleteImages(images);
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Xóa mềm nhà trọ theo id
router.delete('/api/motel-soft-delete/:id', checkRoleAdminAndLandlord, async (req, res) => {
    const id = req.params.id; // Lấy ID nhà trọ từ URL
    const currentDate = getCurrentDateFormatted();

    try {
        // Lấy thông tin user từ middleware
        const existingUser = req.user;

        // Tìm nhà trọ theo ID
        const existingMotel = await Motel.findOne({_id: id, IsDelete:false});
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Kiểm tra danh sách phòng trọ
        if (existingMotel.ListRoomTypes.length > 0) {
            return res.status(400).json({ message: 'Số lượng phòng trong nhà trọ phải bằng 0 trước khi xóa!' });
        }

        // Cập nhật trạng thái xóa mềm
        existingMotel.IsDelete = true;
        existingMotel.UpdateBy = existingUser._id; // Sử dụng ID người dùng từ middleware
        existingMotel.UpdateAt = currentDate;

        await existingMotel.save();

        res.status(200).json({ 
            message: 'Xóa mềm nhà trọ thành công.', 
            data: existingMotel 
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error });
    }
});




//xoá cứng nhà trọ theo id
router.delete('/api/motel-hard-delete/:id', async(req, res) => {
    const id = req.params.id;

    try {
        // Tìm nhà trọ theo ID
        const existingMotel = await Motel.findById(id);
        if (!existingMotel) {
            return res.status(404).json({ message: 'Nhà trọ không tồn tại!' });
        }

        // Tìm người tạo nhà trọ
        const creator = await User.findById(existingMotel.CreateBy);
        if (!creator) {
            return res.status(404).json({ message: 'Không tìm thấy người tạo!' });
        }

        // Tìm chủ trọ dựa trên email
        const landlord = await Landlord.findOne({ Email: creator.Email });
        if (landlord) {
            // Kiểm tra xem nhà trọ có trong danh sách của chủ trọ không
            if (!landlord.ListMotels.includes(existingMotel._id)) {
                return res.status(400).json({ message: 'Không tìm thấy nhà trọ trong danh sách chủ trọ!' });
            }

            // Xóa nhà trọ khỏi danh sách của chủ trọ
            landlord.ListMotels = landlord.ListMotels.filter(
                (motelId) => motelId.toString() !== existingMotel._id.toString()
            );
            await landlord.save();
        }

        // Lấy danh sách ảnh liên quan
        const imagesToDelete = await Images.find({ _id: { $in: existingMotel.ListImages } });

        if (imagesToDelete.length > 0) {
            // Lấy link ảnh để xóa file
            const imageLinks = imagesToDelete.map((img) => img.LinkImage);
            deleteImages(imageLinks); // Hàm này cần xử lý lỗi nếu file không tồn tại

            // Xóa các bản ghi ảnh
            await Images.deleteMany({ _id: { $in: existingMotel.ListImages } });
        }

        // Xóa nhà trọ
        await Motel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Xóa nhà trọ thành công!' });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error });
    }
});


// filter motel 
router.get('/api/motels/filters', async(req, res) => {
    const {
        addressSearch,
        motelHasRoomAvailable,
        noLiveWithLandlord,
        distanceLess1Km,
        desiredDistance,
        desiredPrice,
        haveMezzanine,
        haveToilet,
        havePlaceToCook,
        haveAirConditioner
    } = req.query;


    const filters = {
        addressSearch,
        motelHasRoomAvailable: motelHasRoomAvailable === 'true',
        noLiveWithLandlord: noLiveWithLandlord === 'true',
        desiredPrice: parseFloat(desiredPrice),
        distanceLess1Km: distanceLess1Km === 'true',
        desiredDistance: parseFloat(desiredDistance),
        haveMezzanine: haveMezzanine === 'true',
        haveToilet: haveToilet === 'true',
        havePlaceToCook: havePlaceToCook === 'true',
        haveAirConditioner: haveAirConditioner === 'true'
    };

    const query = {
        IsDelete: false
    };

    if (filters.motelHasRoomAvailable) {
        query.TotalAvailableRoom = { $gt: 0 }
    }

    // Lọc theo addressSearch dựa trên WardCommune
    if (filters.addressSearch) {
        // Kiểm tra xem addressSearch có chứa dấu phẩy không
        const [addressPart, wardCommunePart] = filters.addressSearch.split(',').map(part => part.trim());
        // Nếu tìm thấy dấu phẩy, tìm theo từng phần riêng
        if (wardCommunePart) {
            query.$and = [
                { Address: { $regex: addressPart, $options: 'i' } },
                { WardCommune: { $regex: wardCommunePart, $options: 'i' } }
            ];
        } else {
            query.$or = [
                { Address: { $regex: addressPart, $options: 'i' } },
                { WardCommune: { $regex: addressPart, $options: 'i' } }
            ];
        }
    }

    // Lọc nhà trọ không sống chung với chủ
    if (filters.noLiveWithLandlord) {
        query.LiveWithLandlord = false;
    }

    // Lọc nhà trọ với Distance dưới 1 km
    if (filters.distanceLess1Km) {
        query.Distance = { $lte: 1.0 };
    }

    // Lọc nhà trọ có giá dưới hoặc bằng desiredDistance
    if (!filters.distanceLess1Km) {
        query.Distance = { $lte: filters.desiredDistance };
    }

    // Lọc nhà trọ có giá dưới hoặc bằng desiredPrice
    if (filters.desiredPrice) {
        query.Price = { $lte: filters.desiredPrice };
    }

    // Tạo một mảng chứa các điều kiện tìm kiếm cho ListConvenient
    const conditions = [];

    // Tìm trong ListConvenient có gác lửng
    if (filters.haveMezzanine) {
        conditions.push({ NameConvenient: 'Gác lửng' });
    }

    // Tìm trong ListConvenient có vệ sinh riêng
    if (filters.haveToilet) {
        conditions.push({ NameConvenient: 'Vệ sinh riêng' });
    }

    // Tìm trong ListConvenient có nơi nấu ăn
    if (filters.havePlaceToCook) {
        conditions.push({ NameConvenient: 'Kệ bếp' });
    }

    // Tìm trong ListConvenient có điều hòa
    if (filters.haveAirConditioner) {
        conditions.push({ NameConvenient: 'Điều hoà' });
    }


    try {
        // Thực hiện truy vấn với điều kiện động
        const motelsFirstFilter = await Motel.find(query)
            .populate('ListImages')
            .populate('ListRatings')
            .populate('ListConvenient')

        //Lọc theo ListConvenient nếu có điều kiện
        const motelsLastFilter = conditions.length > 0 ?
            motelsFirstFilter.filter(motel =>
                conditions.every(condition =>
                    motel.ListConvenient.some(convenient =>
                        convenient.NameConvenient === condition.NameConvenient
                    )
                )
            ) :
            motelsFirstFilter;

        // Tạo một mảng mới chứa các motels với field 'totalStar'
        const motelsWithTotalStar = motelsLastFilter.map(motel => {
            // Tính tổng và trung bình sao từ ListRatings
            const ratings = motel.ListRatings;
            let TotalStars = 0;
            if (ratings.length > 0) {
                TotalStars = ratings.reduce((sum, rating) => sum + rating.Star, 0) / ratings.length;
            }

            // Trả về motel kèm với trường totalStar
            return {
                ...motel._doc, // Sao chép tất cả các field hiện có của motel
                TotalStar: TotalStars // Thêm trường totalStar
            };
        });

        const motelsFiltered = getMotelDataFilter(motelsWithTotalStar);
        res.status(200).json({
            message: 'Filtered all motels successfully',
            data: motelsWithTotalStar, // Trả về dữ liệu đã có totalStar
            dataFiltered: motelsFiltered
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy danh sách xã, phường của nhà trọ
router.get('/api/list-ward-commune', async(req, res) => {
    try {
        // Tìm tất cả các nhà trọ và tạo danh sách các trường liên quan
        let listWardCommune = [];
        let listStreet = [];
        const motels = await Motel.find();
        listWardCommune = motels.map(motel => motel.WardCommune);
        listStreet = motels.map(motel => `${motel.Address}, ${motel.WardCommune}`);
        listStreet = listStreet.map(street => street.replace(/^[^a-zA-ZÀ-ỹ]+|[^a-zA-ZÀ-ỹ]+$/g, '').trim());
        listWardCommune = [...new Set(listWardCommune)];
        listStreet = [...new Set(listStreet)];
        let listStreetWardCommune = [...listWardCommune, ...listStreet];

        res.status(200).json({ message: 'Lấy danh sách xã/phường thành công', data: listStreetWardCommune });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

// Đếm số lượng nhà trọ theo xã, phường
router.get('/api/count-motels-by-ward-commune', async(req, res) => {
    try {
        // Tìm tất cả nhà trọ và nhóm theo trường WardCommune, đồng thời đếm số lượng trong mỗi nhóm
        const countByWardCommune = await Motel.aggregate([{
                $group: {
                    _id: "$WardCommune", // Nhóm theo trường WardCommune
                    Count: { $sum: 1 } // Đếm số lượng nhà trọ trong mỗi nhóm
                }
            },
            {
                $project: {
                    _id: 0, // Không hiển thị _id trong kết quả
                    WardCommune: "$_id",
                    Count: 1
                }
            }
        ]);

        res.status(200).json({ message: 'Lấy danh sách số lượng nhà trọ theo xã/phường thành công', data: countByWardCommune });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});



router.get('/api/top-motels', async(req, res) => {
    try {
        // Lấy danh sách các motels chưa bị xóa, sắp xếp theo TotalRating giảm dần và giới hạn 8 cái
        const motels = await Motel.find({ IsDelete: false })
            .sort({ TotalRating: -1 }) // Sắp xếp giảm dần theo TotalRating
            .limit(8) // Giới hạn 8 kết quả
            .populate('ListImages')
            .populate('ListRatings')
            .populate('ListConvenient');

        if (motels.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhà trọ!' });
        }

        res.status(200).json({
            message: 'Lấy top 8 nhà trọ theo đánh giá thành công.',
            data: motels
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
});

module.exports = router;