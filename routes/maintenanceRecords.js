const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {

    // Create a new maintenance record, also update the vehicle's mileage and mileageDate and close the appointment
    router.post('/', async (req, res) => {
        try {
            const { vehicleID, date, type, cost, notes, nextMaintenanceDate, providerID, isAppointment, appointmentID, lastUpdate, mileage, mileageDate } = req.body;

            const existingVehicle = await db.collection('vehicles').findOne({ vehicleID });

            if (!existingVehicle) {
                return res.status(401).json({ error: 'Invalid vehicle' });
            }

            const recordID = uuidv4();
            const newRecord = {
                recordID,
                vehicleID,
                date,
                type,
                cost,
                notes,
                nextMaintenanceDate,
                providerID,
                isAppointment,
                appointmentID
            };

            const result = await db.collection('maintenanceRecords').insertOne(newRecord);
            if (result.insertedCount === 0) {
                throw new Error('Failed to create maintenance record');
            }

            const updateVehicle = await db.collection('vehicles').updateOne({ vehicleID }, { $set: { mileage, mileageDate } });
            if (updateVehicle.modifiedCount === 0) {
                throw new Error('Failed to update vehicle');
            }

            if (isAppointment) {
                const updateAppointment = await db.collection('appointments').updateOne({ appointmentID }, { $set: { appointmentStatus: 'Closed', lastUpdate } });
                if (updateAppointment.modifiedCount === 0) {
                    throw new Error('Failed to update appointment');
                }
            }

            res.status(201).json({ message: 'Maintenance record created successfully' });
        } catch (error) {
            console.error('Failed to create maintenance record:', error);
            res.status(500).json({ error: 'Failed to create maintenance record' });
        }
    });

    return router;
}