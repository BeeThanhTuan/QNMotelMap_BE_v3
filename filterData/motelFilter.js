// Hàm tổng hợp để trả về dữ liệu mong muốn
function getMotelDataFilter(motels) {
    // Lọc nhà trọ không chung chủ
    const motelsWithoutLandlord = motels.filter((motel) => !motel.LiveWithLandlord);
  
    // Lọc nhà trọ dưới 1 km
    const motelsWithin1km = motels.filter((motel) => motel.Distance <= 1);
  
    // Đếm số lượng nhà trọ theo từng loại tiện ích
    const convenientCounts = {};
    
    motels.forEach((motel) => {
      motel.ListConvenient.forEach((convenient) => {
        if (convenientCounts[convenient.NameConvenient]) {
          convenientCounts[convenient.NameConvenient]++;
        } else {
          convenientCounts[convenient.NameConvenient] = 1;
        }
      });
    });
  
    // Trả về data tổng hợp
    return {
      motelsWithoutLandlord,  // Danh sách nhà trọ không chung chủ
      motelsWithin1km,        // Danh sách nhà trọ dưới 1 km
      convenientCounts        // Số lượng nhà trọ theo từng loại tiện ích
    };
  }

module.exports =  getMotelDataFilter ;