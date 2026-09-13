const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services');
const { SuccessResponse, ErrorResponse } = require('../utils/common');

const inMemDb = {};

async function createBooking(req, res) {
    try {
        const response = await BookingService.createBooking({
            userId : req.user.id,
            flightId: req.body.flightId,
            noofSeats: req.body.noofSeats
        });
        SuccessResponse.data = response;
        return res
                .status(StatusCodes.OK)
                .json(SuccessResponse);
    } catch(error) {
    console.log("CONTROLLER ERROR:", error.message);
    console.log("ERROR RESPONSE:", error.response?.data);
    console.log("ERROR CODE:", error.code);

    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
            success: false,
            message: error.message,
            data: {},
            error: error.response?.data || {}
        });
}
}

// removed because it was a simulation for payment before payment services
// async function makePayment(req, res) {
//     try {
//         const idempotencyKey = req.headers['x-idempotency-key'];
//         if(!idempotencyKey ) {
//             return res
//                 .status(StatusCodes.BAD_REQUEST)
//                 .json({message: 'idempotency key missing'});
//         }
//         if(inMemDb[idempotencyKey]) {
//             return res
//                 .status(StatusCodes.BAD_REQUEST)
//                 .json({message: 'Cannot retry on a successful payment'});
//         } 
//         const response = await BookingService.makePayment({
//             totalCost: req.body.totalCost,
//             userId: req.body.userId,
//             bookingId: req.body.bookingId
//         });
//         inMemDb[idempotencyKey] = idempotencyKey;
//         SuccessResponse.data = response;
//         return res
//                 .status(StatusCodes.OK)
//                 .json(SuccessResponse);
//     } catch(error) {
//         console.log(error);
//         ErrorResponse.error = error;
//         return res
//                 .status(StatusCodes.INTERNAL_SERVER_ERROR)
//                 .json(ErrorResponse);
//     }
// }

async function cancelBooking(req, res) {
    try {
        const response = await BookingService.cancelBooking(
            req.params.bookingId,
            req.user.id
        );

        SuccessResponse.data = response;

        return res
            .status(StatusCodes.OK)
            .json(SuccessResponse);

    } catch(error) {
        console.log(error);

        ErrorResponse.error = error;

        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
    }
}

async function getBooking(req, res) {
    try {
        const response = await BookingService.getBooking(
            req.params.bookingId,
            req.user.id
        );

        SuccessResponse.data = response;

        return res
            .status(StatusCodes.OK)
            .json(SuccessResponse);

    } catch (error) {
        console.log(error);

        ErrorResponse.error = error;

        return res
            .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(ErrorResponse);
    }
}


async function confirmBooking(req, res) {
    try {
        const booking = await BookingService.confirmBooking(
            req.params.bookingId
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Booking confirmed successfully',
            data: booking
        });
    } catch (error) {
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
}



module.exports = {
    createBooking,
    
    cancelBooking,
    getBooking,
    confirmBooking
}