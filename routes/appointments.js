const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {

    // Get all appointments with vehicles details joined using reference vehicleID in appointments collection. 
    // also give the provider details using providerID in appointments collection
    router.get('/:ownerID', async (req, res) => {
        try {
            const appointments = await db.collection('appointments').aggregate([
                {
                    $lookup: {
                        from: 'vehicles',
                        localField: 'vehicleID',
                        foreignField: 'vehicleID',
                        as: 'vehicleDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'serviceProviders',
                        localField: 'providerID',
                        foreignField: 'providerID',
                        as: 'providerDetails'
                    }
                },
                {
                    $match: {
                        'vehicleDetails.ownerID': req.params.ownerID
                    }
                }]).toArray();

            res.json(appointments);
        } catch (error) {
            console.error('Failed to retrieve appointments:', error);
            res.status(500).json({ error: 'Failed to retrieve appointments' });
        }
    });

    // Add a new appointment
    router.post('/', async (req, res) => {
        try {
            const { vehicleID, appointmentDate, serviceType, providerID, appointmentStatus, notes, lastUpdate } = req.body;

            const existingVehicle = await db.collection('vehicles').findOne({ vehicleID });

            if (!existingVehicle) {
                return res.status(401).json({ error: 'Invalid vehicle' });
            }

            const appointmentID = uuidv4();
            const newAppointment = {
                appointmentID,
                vehicleID,
                appointmentDate,
                serviceType,
                providerID,
                appointmentStatus,
                notes,
                lastUpdate
            };

            await db.collection('appointments').insertOne(newAppointment);

            res.status(201).json({ message: 'Appointment added successfully' });
        } catch (error) {
            console.error('Failed to add appointment:', error);
            res.status(500).json({ error: 'Failed to add appointment' });
        }
    });

    // Update an appointment
    router.put('/:appointmentID', async (req, res) => {
        try {
            const { appointmentID } = req.params;
            const { vehicleID, appointmentDate, serviceType, providerID, appointmentStatus, notes, lastUpdate } = req.body;

            const existingAppointment = await db.collection('appointments').findOne({ appointmentID });

            if (!existingAppointment) {
                return res.status(401).json({ error: 'Invalid appointment' });
            }

            const result = await db.collection('appointments').updateOne({ appointmentID }, { $set: { vehicleID, appointmentDate, serviceType, providerID, appointmentStatus, notes, lastUpdate } });
            
            if (result.modifiedCount === 0) {
                throw new Error('Failed to update appointment');
            }
            else{
                res.json({ message: 'Appointment updated successfully' });
            }
        } catch (error) {
            console.error('Failed to update appointment:', error);
            res.status(500).json({ error: 'Failed to update appointment' });
        }
    });

    // Get all appointments of a provider, also give owner details using ownerID in vehicles collection, 
    // and maintenance record of the appointment using appointmentID in maintenanceRecords collection
    router.get('/provider/:providerID', async (req, res) => {
        try{
            const appointments = await db.collection('appointments').aggregate([
                {
                    $lookup: {
                        from: 'vehicles',
                        localField: 'vehicleID',
                        foreignField: 'vehicleID',
                        as: 'vehicleDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'owners',
                        localField: 'vehicleDetails.ownerID',
                        foreignField: 'ownerID',
                        as: 'ownerDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'maintenanceRecords',
                        localField: 'appointmentID',
                        foreignField: 'appointmentID',
                        as: 'maintenanceRecordDetails'
                    }
                },
                {
                    $match: {
                        providerID: req.params.providerID
                    }
                }]).toArray();

            res.json(appointments);

        }
        catch{
            console.error('Failed to retrieve appointments:', error);
            res.status(500).json({ error: 'Failed to retrieve appointments' });
        }
        
    });

    return router;
    
}