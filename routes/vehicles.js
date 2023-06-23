const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
    // Get all vehicles
    router.get('/', async (req, res) => {
        try {
            const vehicles = await db.collection('vehicles').find().toArray();
            res.json(vehicles);
        } catch (error) {
            console.error('Failed to retrieve vehicles:', error);
            res.status(500).json({ error: 'Failed to retrieve vehicles' });
        }
    });

    // Get a specific vehicle by OwnerID join with maintenance records of that vehicle
    router.get('/withMr/:ownerID', async (req, res) => {
        try {
            const vehicles = await db.collection('vehicles').aggregate([
                {
                    $match: {
                        ownerID: req.params.ownerID
                    }
                },
                {
                    $lookup: {
                        from: 'maintenanceRecords',
                        localField: 'vehicleID',
                        foreignField: 'vehicleID',
                        as: 'maintenanceRecords'
                    }
                }
            ]).toArray();

            res.json(vehicles);
        }
        catch (error) {
            console.error('Failed to retrieve vehicles:', error);
            res.status(500).json({ error: 'Failed to retrieve vehicles' });
        }
    });

    // Get a specific vehicle by ownerID without maintenance records
    router.get('/:ownerID', async (req, res) => {
        try {
            const vehicles = await db.collection('vehicles').find({ ownerID: req.params.ownerID }).toArray();
            res.json(vehicles);
        } catch (error) {
            console.error('Failed to retrieve vehicles:', error);
            res.status(500).json({ error: 'Failed to retrieve vehicles' });
        }
    });   
    

    // Add a new vehicle
    router.post('/', async (req, res) => {
        try {
            const { ownerID, VIN, make, model, year, mileage, mileageDate, licensePlate, state } = req.body;

            const existingVehicle = await db.collection('vehicles').findOne({ VIN });

            const existingOwner = await db.collection('owners').findOne({ ownerID });

            if (!existingOwner) {
                return res.status(401).json({ error: 'Invalid owner' });
            }

            if (existingVehicle) {
                return res.status(409).json({ error: 'Vehicle with the same VIN already exists' });
            }
            const vehicleID = uuidv4();
            const newVehicle = {
                vehicleID,
                make,
                model,
                year,
                VIN,
                ownerID,
                mileage,
                mileageDate,
                licensePlate, 
                state
            };

            await db.collection('vehicles').insertOne(newVehicle);

            res.status(201).json({ message: 'Vehicle added successfully' });
        } catch (error) {
            console.error('Failed to add vehicle:', error);
            res.status(500).json({ error: 'Failed to add vehicle' });
        }
    });

    // Update a vehicle by vehicleID
    router.put('/:vehicleID', async (req, res) => {
        try {
            const { vehicleID } = req.params;
            const { make, model, year, mileage, mileageDate, licensePlate, state } = req.body;

            const result = await db.collection('vehicles').updateOne(
                { vehicleID },
                {
                    $set: {
                        make,
                        model,
                        year,
                        mileage,
                        mileageDate,
                        licensePlate,
                        state
                    },
                }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }

            res.json({ message: 'Vehicle updated successfully' });
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            res.status(500).json({ error: 'Failed to update vehicle' });
        }
    });

    // Delete a vehicle by vehicleID
    router.delete('/:vehicleID', async (req, res) => {
        try {
            const { vehicleID } = req.params;

            const result = await db.collection('vehicles').deleteOne({ vehicleID });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Vehicle not found' });
            }
            // Delete all maintenance records for this vehicle
            const maintenanceRecordDelete = await db.collection('maintenanceRecords').deleteMany({ vehicleID });
            // Delete all appointments for this vehicle
            const appointmentDelete = await db.collection('appointments').deleteMany({ vehicleID });

            console.log('Deleted maintenance records:', maintenanceRecordDelete.deletedCount);
            console.log('Deleted appointments:', appointmentDelete.deletedCount);

            res.json({ message: 'Vehicle deleted successfully' });
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            res.status(500).json({ error: 'Failed to delete vehicle' });
        }
    });

    return router;
};