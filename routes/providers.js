const e = require('express');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
    // get all providers
    router.get('/', async (req, res) => {
        try{
            const providers = await db.collection('serviceProviders').find().toArray();
            res.json(providers);
        }
        catch{
            console.error('Failed to retrieve providers');
            res.status(500).json({ error: 'Failed to retrieve providers' });
        }
    });

    // add a new provider
    router.post('/', async (req, res) => {
        try{
            const { name, email, phone, address} = req.body;

            const providerID = uuidv4();

            const newProvider = {
                providerID,
                name,
                email,
                phone,
                address
            };

            await db.collection('serviceProviders').insertOne(newProvider);

            res.status(201).json({ message: 'Provider added successfully' });
        }
        catch{
            console.error('Failed to add provider');
            res.status(500).json({ error: 'Failed to add provider' });
        }
    });

    // update a provider
    router.put('/', async (req, res) => {
        try{
            const { providerID, name, email, phone, address} = req.body;

            const existingProvider = await db.collection('serviceProviders').findOne({ providerID });

            if (!existingProvider) {
                return res.status(401).json({ error: 'Invalid provider' });
            }

            const result = await db.collection('serviceProviders').updateOne(
                { providerID },
                {
                    $set: {
                        name,
                        email,
                        phone,
                        address
                    }
                }
            );
                
            if (result.modifiedCount === 0) {
                throw new Error('Failed to update provider');
            }
            else{
                res.json({ message: 'Provider updated successfully' });
            }
        }
        catch{
            console.error('Failed to update provider');
            res.status(500).json({ error: 'Failed to update provider' });
        }
    });

    // delete a provider
    router.delete('/:providerID', async (req, res) => {
        try{
            const { providerID } = req.params;

            const existingProvider = await db.collection('serviceProviders').findOne({ providerID });

            if (!existingProvider) {
                return res.status(401).json({ error: 'Invalid provider' });
            }

            const result = await db.collection('serviceProviders').deleteOne({ providerID });

            if (result.deletedCount === 0) {
                throw new Error('Failed to delete provider');
            }
            else{
                res.json({ message: 'Provider deleted successfully' });
            }
        }
        catch{
            console.error('Failed to delete provider');
            res.status(500).json({ error: 'Failed to delete provider' });
        }
    });

    return router;
}