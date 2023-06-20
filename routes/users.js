const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

module.exports = (db) => {
    router.post('/register', async (req, res) => {
        try {
            const { name, email, phone, address, password } = req.body;
            const existingOwner = await db.collection('owners').findOne({ email });
            console.log(existingOwner);

            if (existingOwner) {
                return res.status(409).json({ error: 'Email is already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const ownerID = uuidv4();

            const newOwner = {
                ownerID,
                name,
                email,
                phone,
                address,
                password: hashedPassword
            };

            console.log(newOwner);

            await db.collection('owners').insertOne(newOwner);

            res.status(201).json({ message: 'Owner registered successfully' });
        } catch (error) {
            console.error('Failed to register owner:', error);
            res.status(500).json({ error: 'Failed to register owner' });
        }
    });

    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            const owner = await db.collection('owners').findOne({ email });
            

            if (!owner) {
                return res.status(401).json({ error: 'Invalid Email or Password' });
            }

            const isPasswordValid = await bcrypt.compare(password, owner.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid Email or Password' });
            }

            const token = jwt.sign({ ownerId: owner._id }, 'secretKey');
            //   remove password from owner object
            delete owner.password;
            res.json({ token, owner });
        } catch (error) {
            console.error('Failed to log in owner:', error);
            res.status(500).json({ error: 'Failed to log in owner' });
        }
    });
    return router;
};
