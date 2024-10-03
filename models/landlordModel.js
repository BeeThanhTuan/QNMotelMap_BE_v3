const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Landlord
const LandlordSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    LandlordName: { type: String, required: true },
    Image: { type: String},
    PhoneNumber:{type: String, required: true},
    Address:{type: String},
    ListMotel: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Motel' }],
    CreateAt: {type: String, require: true},
    UpdateAt: {type: String},
    UpdateBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, {
    collection: "Landlord"
});

// Tạo model Landlord từ schema
const Landlord = mongoose.model('Landlord', LandlordSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Landlord;