const mongoose = require('mongoose');
const Role = require('./roleModel')
const bcrypt = require('bcryptjs');
// Định nghĩa schema cho đối tượng User
const UserSchema = new mongoose.Schema({
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
    CreateAt: {type: String, require: true}
}, {
    collection: "User"
});

// Hash mật khẩu trước khi lưu
UserSchema.pre('save', async function(next) {
    if (!this.isModified('Password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.Password = await bcrypt.hash(this.Password, salt);
    next();
});

// Tạo model User từ schema
const User = mongoose.model('User', UserSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = User;