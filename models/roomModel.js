const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Room
const MotelSchema = new mongoose.Schema({
    MotelID: { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', required: true },
    Description: { type: String },
    Floor: { type: Number },
    Status: {type: Boolean},
    Area: { type: Number },
    Price: { type: Number },
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    ListComments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    CreateAt: {type: String, require: true},
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    UpdateAt: {type: String},
    UpdateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    collection: "Motel"
});

// Tạo model Room từ schema
const Motel = mongoose.model('Motel', MotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Motel;