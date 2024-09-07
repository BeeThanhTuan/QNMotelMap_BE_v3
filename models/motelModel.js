const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Định nghĩa schema cho đối tượng User
const MotelSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    RoleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    },
    Address: { type: String },
    Image: { type: String },
    PhoneNumber: { type: String },
    CreateAt: {type: String, require: true},
    UpdateAt: {type: String}

}, {
    collection: "Motel"
});

// Tạo model User từ schema
const Motel = mongoose.model('Motel', MotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Motel;