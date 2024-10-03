const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Thêm fs module

// Thư mục chứa ảnh
const dirname = __dirname.replace('\\upload-image', '');
const IMAGE_DIR = `${dirname}/resources/img-convenients`;

// Cấu hình lưu trữ cho multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, IMAGE_DIR); // Thư mục chứa ảnh
    },
    filename: function(req, file, cb) {
        // Tạo tên tệp tin duy nhất bằng cách thêm thời gian hiện tại vào tên tệp tin gốc
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Cấu hình multer để chỉ chấp nhận ảnh
const uploadImageConvenient = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Kiểm tra xem tệp tin có phải là ảnh không
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Chỉ chấp nhận các tệp tin ảnh!'));
        }
        cb(null, true);
    }
}).single('image');


// Function để xóa ảnh
function deleteImageConvenient(image) {
    if (image) {
        const imagePath = path.join( IMAGE_DIR, image); // Kết hợp đường dẫn tới ảnh
        // Kiểm tra xem file có tồn tại không trước khi xóa
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

// Export uploadImage và deleteImage
module.exports = { uploadImageConvenient, deleteImageConvenient };
