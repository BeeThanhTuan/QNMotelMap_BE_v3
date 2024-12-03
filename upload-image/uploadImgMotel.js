const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Thư mục chứa ảnh
const dirname = __dirname.replace('\\upload-image', '');
const IMAGE_DIR = `${dirname}/resources/img-motels`;

// Cấu hình lưu trữ cho multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, IMAGE_DIR); // Thư mục chứa ảnh
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = crypto.randomBytes(4).toString('hex'); // Tạo chuỗi ngẫu nhiên
        cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Cấu hình multer để chỉ chấp nhận ảnh và upload nhiều tệp
const uploadImagesMotel = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Kiểm tra xem tệp tin có phải là ảnh không
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Chỉ chấp nhận các tệp tin ảnh!'));
        }
        cb(null, true);
    }
}).array('listImages', 8);

// Function để xóa ảnh
function deleteImagesMotel(image) {
    if (image) {
        const imagePath = path.join(IMAGE_DIR, image); // Kết hợp đường dẫn tới ảnh
        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image:', err);
                } else {
                    console.log('Image deleted successfully:', image);
                }
            });
        } else {
            console.log('Image not found:', image);
        }
    }
}

// Export uploadImagesMotel và deleteImagesMotel
module.exports = { uploadImagesMotel, deleteImagesMotel };