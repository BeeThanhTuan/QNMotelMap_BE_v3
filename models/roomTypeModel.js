const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Room
const RoomTypeSchema = new mongoose.Schema({
    MotelID: { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', required: true },
    Description: { type: String },
    Amount: { type: Number },
    Available: {type: Number},
    Area: { type: Number },
    Price: { type: Number },
    ListConvenient: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Convenient' }],
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    CreateAt: {type: String, require: true},
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    UpdateAt: {type: String},
    UpdateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    collection: "RoomType"
});

// Tạo model RoomType từ schema
const RoomType= mongoose.model('RoomType', RoomTypeSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = RoomType;