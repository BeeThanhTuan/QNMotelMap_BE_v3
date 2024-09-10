const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Comment
const RatingSchema = new mongoose.Schema({
    MotelID:  { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', require: true },
    Star: {type: Number, require: true },
    Comment: { type: String, require: true },
    CreateAt: { type: String, require: true },
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },

}, {
    collection: "Rating"
});

// Tạo model Comment từ schema
const Rating = mongoose.model('Rating', RatingSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Rating;