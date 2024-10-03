const express = require('express');
const router = express.Router();
const Convenient =  require('../models/convenientModel');
const { uploadImageConvenient, deleteImageConvenient } = require('../upload-image/uploadImgConvenient');

//add new convenient
router.post('/api/convenient', uploadImageConvenient, async (req, res) => {
    const { nameConvenient} = req.body;
    const image = req.file ? req.file.filename : '';
    try {
        if(!image){
            deleteImageConvenient(image);
            return res.status(400).json({ message: 'Image is required!' });
        }
        // Kiểm tra convenient đã tồn tại hay chưa
        const existingConvenient = await Convenient.findOne({ NameConvenient: nameConvenient });
        if (existingConvenient) {
            deleteImageConvenient(image);
            return res.status(400).json({ message: 'Convenient already exists!' });
        }

        const newConvenient = new Convenient({
           NameConvenient: nameConvenient,
           LinkImage: image,
        });
        await newConvenient.save();
        res.status(201).json({ message: 'Convenient created successfully!', data: newConvenient});

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

//update convenient by id
router.put('/api/convenient/:id', uploadImageConvenient, async (req, res) => {
    const { nameConvenient} = req.body;
    const id = req.params.id
    const newImage = req.file ? req.file.filename : '';
    
    try {
        // Kiểm tra convenient đã tồn tại hay chưa
        const existingConvenient = await Convenient.findById(id);
        if (!existingConvenient) {
           if(newImage){
            deleteImageConvenient(newImage);
           }
            return res.status(404).json({ message: 'Convenient not found!' });
        }

        const existingNameConvenient = await Convenient.findOne({ NameConvenient: nameConvenient });
        if (existingNameConvenient) {
            if(newImage){
                deleteImageConvenient(newImage);
            }
            return res.status(400).json({ message: 'Name convenient already exists!' });
        }

        // Update the convenient
        if  (nameConvenient) existingConvenient.NameConvenient = nameConvenient;
        if (newImage) existingConvenient.LinkImage = newImage; 

        await existingConvenient.save();
        
        res.status(201).json({ message: 'Convenient updated successfully!', data: existingConvenient});

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;