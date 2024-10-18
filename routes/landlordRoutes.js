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

module.exports = router;