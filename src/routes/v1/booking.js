const express = require('express');

const { BookingController } = require('../../controllers');

const router = express.Router();

router.post(
    '/',
    BookingController.createBooking
)

// router.post(
//     '/payments',
//     BookingController.makePayment
// );

router.patch(
    '/:bookingId/cancel',
    BookingController.cancelBooking
);

router.get('/:bookingId', BookingController.getBooking);

router.patch(
    '/:bookingId/confirm',
    BookingController.confirmBooking
);

module.exports = router;