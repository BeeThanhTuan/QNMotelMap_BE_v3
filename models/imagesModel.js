const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượnImages
const ImagesSchema = new mongoose.Schema({
    MotelID: { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', default: null },
    RoomID: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null }, 
    LinkImage: { type: String, require: true },

}, {
    collection: "Images"
});

// Tạo model Model từ schema
const Images = mongoose.model('Images',ImagesSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Images;