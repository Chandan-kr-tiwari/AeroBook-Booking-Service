const express = require('express');

const { BookingController } = require('../../controllers');

const Authenticate =require('../../middlewares/authenticate-middlewares')

const router = express.Router();

router.post(
    '/',
    Authenticate,
    BookingController.createBooking
)


router.patch(
    '/:bookingId/cancel',
    Authenticate,
    BookingController.cancelBooking
);

router.get('/:bookingId', Authenticate, BookingController.getBooking);

router.patch(
    '/:bookingId/confirm',
    Authenticate,
    BookingController.confirmBooking
);

module.exports = router;