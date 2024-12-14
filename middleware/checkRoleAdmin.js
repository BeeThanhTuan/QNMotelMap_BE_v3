const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { Role, RoleEnum } = require('../models/roleModel');
const ACCESS_TOKEN_SECRET = 'ntt_access_token_secret';

const checkRoleAdmin = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        // Decode token to retrieve user details
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const email = decoded.email;

        // Find the user in the database
        const existingUser = await User.findOne({ Email: email });

        if (!existingUser) {
            return res.status(404).json({ message: 'User does not exist!' });
        }

        const roleID = existingUser.RoleID.toString();
        // Check if user's role is Admin
        const role = await Role.findById(roleID);

        if (!role) {
            return res.status(400).json({ message: 'Role not valid!' });
        }

        if (role.RoleName !== RoleEnum.ADMIN) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        req.user = existingUser; // Attach user info to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ message: 'Server error while checking role.' });
    }
};

module.exports = checkRoleAdmin;
