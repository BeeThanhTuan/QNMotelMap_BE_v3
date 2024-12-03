const express = require('express');
const router = express.Router();
const {Role, RoleEnum} = require('../models/roleModel');

// Get all roles
router.get('/api/roles', async (req, res) => {
    try {
        const roles = await Role.find(); 
        if (roles.length === 0) {
            return res.status(404).json({ message: 'No roles found' });
        }
        
        res.status(200).json({ message: 'Get roles success!', data: roles });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

//get role id by role name
router.get('/api/role-id/:roleName', async (req, res) => {
    const { roleName } = req.params; // Lấy roleName từ params
    try {
        // Tìm role dựa trên RoleName
        const role = await Role.findOne({ RoleName: roleName });
        
        if (!role) {
            return res.status(404).json({ message: `Role with name '${roleName}' not found` });
        }

        res.status(200).json({ message: 'Get RoleID success!', data: { RoleID: role._id } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// get role name by role id
router.get('/api/role-name/:roleId', async (req, res) => {
    const { roleId } = req.params;
    try {
        // Tìm role trong database dựa trên roleId
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.status(200).json({ message: 'Get role name success!', data: { RoleName: role.RoleName } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching role' });
    }
});

// create new role
router.post('/api/role', async (req, res) => {
    const { roleName } = req.body;
    try {
        // check role name 
        if (!Object.values(RoleEnum).includes(roleName)) {
            return res.status(400).json({ message: 'RoleName invalid!' });
        }
        // check role exists
        const existingRole = await Role.findOne({ RoleName: roleName });
        if (existingRole) {
            return res.status(400).json({ message: 'Role already exists!' });
        }
        // create new 
        const newRole = new Role({ RoleName: roleName });
        await newRole.save();
        res.status(201).json({ message: 'Create role is success!', data: newRole });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete role
router.delete('/api/role/:id', async (req, res) => {
    const { id } = req.params;  
    try {
        // find and delete
        const result = await Role.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: 'No role found' });
        }
        
        res.status(200).json({ message: 'Role deleted successfully', data: result });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;