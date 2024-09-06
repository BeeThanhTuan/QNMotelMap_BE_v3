const mongoose = require('mongoose');

const connectDB = async() => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/QNMotelMap_v3', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB success');
    } catch (error) {
        console.error('Connection error:', error);
        process.exit(1); // Thoát ứng dụng nếu không thể kết nối đến cơ sở dữ liệu
    }
};

module.exports = connectDB;