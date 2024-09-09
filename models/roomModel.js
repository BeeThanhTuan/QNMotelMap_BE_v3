const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Room
const RoomSchema = new mongoose.Schema({
    MotelID: { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', required: true },
    Description: { type: String },
    Floor: { type: Number },
    Status: {type: Boolean},
    Area: { type: Number },
    Convenient: { type: String },
    Price: { type: Number },
    ListImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Images' }],
    CreateAt: {type: String, require: true},
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    UpdateAt: {type: String},
    UpdateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, {
    collection: "Room"
});

// Tạo model Room từ schema
const Room = mongoose.model('Room', RoomSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Room;