const cron = require('node-cron');
const { cancelOldBookings } = require('../services');

cron.schedule('* * * * *', async () => {
    try {
        console.log('Running old booking cleanup...');
        await cancelOldBookings();
    } catch (error) {
        console.error('Error while cancelling old bookings:', error);
    }
});