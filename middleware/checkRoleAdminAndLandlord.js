const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const {Role, RoleEnum} = require('../models/roleModel');
const ACCESS_TOKEN_SECRET = 'ntt_access_token_secret';

const checkRoleAdminAndLandlord = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Lấy token từ Authorization header (Bearer <token>)
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        // Giải mã token để lấy thông tin người dùng
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET); 
        const email = decoded.email; 

        // Tìm người dùng trong database
        const existingUser = await User.findOne({Email: email, IsDelete: false})
        
        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist!' });
        }
        const roleID = existingUser.RoleID.toString()
        // Kiểm tra quyền của người dùng
        const role = await Role.findById(roleID);

        if (!role) {
            return res.status(400).json({ message: 'Role not valid!' });
        }

        if (role.RoleName !== RoleEnum.ADMIN && role.RoleName !== RoleEnum.LANDLORD) {
            return res.status(400).json({ message: 'Role no access!' });
        }

        req.user = existingUser;

        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ message: 'Server error while checking role.' });
    }
};

module.exports = checkRoleAdminAndLandlord;
