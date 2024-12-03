const mongoose = require('mongoose');

// Định nghĩa schema cho đối tượng Motel
const MotelSchema = new mongoose.Schema({
    Location: { type: String, require: true },
    Address:{ type: String, require: true },
    NameMotel:{ type: String},
    WardCommune:{ type: String, require: true },
    Description: { type: String, require: true },
    TotalRating: { type: Number },
    Price:  { type: Number },
    ElectricityBill: { type: Number, require: true },
    WaterBill:{ type: Number, require: true },
    WifiBill:{ type: Number },
    Distance: { type: Number },
    LiveWithLandlord: { type: Boolean },
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    ListRoomTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' }],
    ListRatings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
    ListConvenient: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Convenient' }],
    LandlordName:{ type: String, require: true },
    PhoneNumberContact: { type: String, require: true },
    AddressLandlord:{ type: String },
    CreateAt: { type: String, require: true },
    CreateBy:  { type: mongoose.Schema.Types.ObjectId, require: true  },
    UpdateAt: { type: String },
    UpdateBy: { type: mongoose.Schema.Types.ObjectId },

}, {
    collection: "Motel"
});

// Tạo model Model từ schema
const Motel = mongoose.model('Motel', MotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Motel;