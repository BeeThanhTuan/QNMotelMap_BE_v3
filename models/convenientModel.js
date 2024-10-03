const mongoose = require('mongoose');
// Định nghĩa schema cho đối tượng Convenient
const ConvenientSchema = new mongoose.Schema({
   NameConvenient: { type: String, require: true, unique: true,  required: true},
   LinkImage: { type: String, require: true, required: true },

}, {
    collection: "Convenient"
});

// Tạo model Convenient từ schema
const Convenient= mongoose.model('Convenient', ConvenientSchema);

// Xuất model để có thể sử dụng ở nơi khác trong ứng dụng
module.exports = Convenient;