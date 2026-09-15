const cron = require('node-cron');
const { BookingService } = require('../services');

cron.schedule('* * * * *', async () => {
    try {
        console.log('Running old booking cleanup...');
        await BookingService.cancelOldBookings();
    } catch (error) {
        console.error('Error while cancelling old bookings:', error);
    }
});