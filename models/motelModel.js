const mongoose = require('mongoose');

// Định nghĩa schema cho đối tượng Motel
const MotelSchema = new mongoose.Schema({
    Location: { type: String, require: true },
    LandlordID: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord', required: true },
    Address:{ type: String, require: true },
    NameMotel:{ type: String},
    WardCommune:{ type: String, require: true },
    Description: { type: String },
    TotalRating: { type: Number },
    Price:  { type: Number },
    ElectricityBill: { type: Number },
    WaterBill:{ type: Number },
    WifiBill:{ type: Number },
    Distance: { type: Number },
    LiveWithLandlord: { type: Boolean },
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    ListRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    ListRatings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
    ListConvenient: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Convenient' }],
    CreateAt: { type: String, require: true },
    CreateBy:  { type: String },
    UpdateAt: { type: String },
    UpdateBy: { type: String },

}, {
    collection: "Motel"
});

// Tạo model Model từ schema
const Motel = mongoose.model('Motel', MotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Motel;