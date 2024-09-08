const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Comment
const CommentSchema = new mongoose.Schema({
    MotelID:  { type: mongoose.Schema.Types.ObjectId, ref: 'Motel', require: true },
    Rating: {type: Number},
    Content: { type: String, require: true },
    CreateAt: { type: String, require: true },
    CreateBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },

}, {
    collection: "Comment"
});

// Tạo model Comment từ schema
const Comment = mongoose.model('Comment', CommentSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Comment;