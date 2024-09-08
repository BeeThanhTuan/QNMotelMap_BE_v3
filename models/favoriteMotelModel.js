const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Favorite Motel
const FavoriteMotelSchema = new mongoose.Schema({
    UserID:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    ListMotels : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Motel' }],

}, {
    collection: "FavoriteMotel"
});

// Tạo model Favorite Motel từ schema
const FavoriteMotel = mongoose.model('FavoriteMotel', FavoriteMotelSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = FavoriteMotel;