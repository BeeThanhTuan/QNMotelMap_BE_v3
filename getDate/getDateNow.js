function getCurrentDateFormatted() {
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0'); // Ngày
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng (tháng bắt đầu từ 0)
    const year = now.getFullYear(); // Năm

    return `${day}/${month}/${year}`;
}

// Xuất hàm để sử dụng ở nơi khác
module.exports =  getCurrentDateFormatted ;