const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

module.exports = (db) => {
    // admin login
    router.post('/login', async (req, res) => {
        try{
            const { username, password } = req.body;
            const user = await db.collection('admin').findOne({ username });
            if (!user) {
                return res.status(401).json({ error: 'Invalid Username or Password' });
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid Username or Password' });
            }
            const token = jwt.sign(user.username, 'secretKey');
            delete user.password;
            res.json({ token, user });
        }
        catch{
            console.error('Failed to login');
            res.status(500).json({ error: 'Failed to login' });
        }
    });

    // change password
    router.put('/change-password', async (req, res) => {
        try{
            const { username, oldPassword, newPassword } = req.body;
            const user = await db.collection('admin').findOne({ username });
            // console.log(await bcrypt.hash(oldPassword, 10));

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
            console.log(isPasswordValid);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const result = await db.collection('admin').updateOne({ username }, { $set: { password: hashedPassword, isFirstTime:false } });
            if (result.modifiedCount === 0) {
                throw new Error('Failed to change password');
            }
            else{
                res.json({ message: 'Password changed successfully' });
            }
        }
        catch{
            console.error('Failed to change password:');
            res.status(500).json({ error: 'Failed to change password' });
        }
    });

    // add a new admin
    router.post('/', async (req, res) => {
        try{
            const { name, username, password, email, isSuperAdmin } = req.body;

            const existingAdmin = await db.collection('admin').findOne({ username });

            if (existingAdmin) {
                return res.status(409).json({ error: 'Username is already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAdmin = {
                name,
                username,
                password: hashedPassword,
                email,
                isSuperAdmin
            };

            await db.collection('admin').insertOne(newAdmin);

            res.status(201).json({ message: 'Admin added successfully' });
        }
        catch{
            console.error('Failed to add admin');
            res.status(500).json({ error: 'Failed to add admin' });
        }
    });

    // get all admins
    router.get('/', async (req, res) => {
        try{
            const admins = await db.collection('admin').find({}, { projection: { password: 0 } }).toArray();
            res.json(admins);
        }
        catch{
            console.error('Failed to retrieve admins');
            res.status(500).json({ error: 'Failed to retrieve admins' });
        }
    });

    // delete an admin
    router.delete('/:username', async (req, res) => {
        try{
            const { username } = req.params;

            const existingAdmin = await db.collection('admin').findOne({ username });

            if (!existingAdmin) {
                return res.status(401).json({ error: 'Invalid admin' });
            }

            const result = await db.collection('admin').deleteOne({ username });
            if (result.deletedCount === 0) {
                throw new Error('Failed to delete admin');
            }
            else{
                res.json({ message: 'Admin deleted successfully' });
            }
        }
        catch{
            console.error('Failed to delete admin');
            res.status(500).json({ error: 'Failed to delete admin' });
        }
    });

    return router;
}