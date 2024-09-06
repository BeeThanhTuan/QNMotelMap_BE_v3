const mongoose = require('mongoose');

// Enum cho Role
const RoleEnum = {
    ADMIN: 'Admin',
    LANDLORD: 'Landlord',
    CLIENT: 'Client'
};

// Định nghĩa schema cho đối tượng Roles
const RoleSchema = new mongoose.Schema({
    //_id
    RoleName: {
        type: String,
        required: true, 
        enum: Object.values(RoleEnum)
    }
}, {
    collection: "Role", // Đặt thuộc tính collection ở đây
});

// Tạo model Role từ schema
const Role = mongoose.model('Role', RoleSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = { Role, RoleEnum };