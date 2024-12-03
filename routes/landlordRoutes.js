const express = require('express');
const Landlord = require('../models/landlordModel');
const router = express.Router();

// Get landlord by ID
router.get('/api/landlord/:id', async (req, res) => {
    const id = req.params.id;
    try {
        // Find motel by ID and populate the related fields
        const existingLandlord = await Landlord.findById(id)

        if (!existingLandlord) {
            return res.status(404).json({ message: 'Landlord does not exist!' });
        }

        res.status(200).json({ message: 'Get landlord by id successfully', data: existingLandlord });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get landlord by ID
router.get('/api/landlord-by-email/:email', async (req, res) => {
    const email = req.params.email;
    try {
        // Find motel by ID and populate the related fields
        const existingLandlord = await Landlord.findOne({Email : email})
        .populate({
            path: 'ListMotels', // Populate danh sách các Motel
            populate: {
                path: 'ListImages', // Populate danh sách các Images của mỗi Motel
                select: 'LinkImage', // Chỉ lấy trường `LinkImage` từ Images
            },
        })
        .populate({
            path: 'ListMotels',
            populate: {
                path: 'ListConvenient',
            },
        });

        if (!existingLandlord) {
            return res.status(404).json({ message: 'Landlord does not exist!' });
        }

        res.status(200).json({ message: 'Get landlord by id successfully', data: existingLandlord });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;