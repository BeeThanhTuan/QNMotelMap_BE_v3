const mongoose = require('mongoose');

// Định nghĩa schema cho đối tượng Motel
const MotelSchema = new mongoose.Schema({
    LandlordID: { type: mongoose.Schema.Types.ObjectId, ref: 'Landlord', required: true },
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    Address: { type: String, require: true },
    Description: { type: String },
    TotalRating: { type: Number },
    ListRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    CreateAt: { type: String, require: true },
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    UpdateAt: { type: String },
    UpdateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    collection: "Motel"
});

// Tạo model Model từ schema
const Motel = mongoose.model('Motel', MotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Motel;