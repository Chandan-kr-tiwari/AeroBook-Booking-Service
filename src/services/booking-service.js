const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const {PublishEvent} =require('../events')

const { BookingRepository } = require('../repositories');
const { ServerConfig, Queue } = require('../config');
const db = require('../models');
const AppError = require('../utils/errors/app-error');
const { Enums } = require('../utils/common');

const { BOOKED, CANCELLED } = Enums.BOOKING_STATUS;

const bookingRepository = new BookingRepository();

async function createBooking(data ,token) {
    const transaction = await db.sequelize.transaction();

    try {
        console.log(
            "Flight Service URL:",
            ServerConfig.AEROBOOK_FLIGHT_SERVICE
        );

        const url =
            `${ServerConfig.AEROBOOK_FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`;

        console.log("Final URL:", url);

        console.log("Token being forwarded:", token);

        const flight = await axios.get(url, {
            headers: {
                Authorization: token
            }
        });

        console.log("Flight response:", flight.data);

        const flightData = flight.data.data;

        if (data.noofSeats > flightData.totalSeats) {
            throw new AppError(
                'Not enough seats available',
                StatusCodes.BAD_REQUEST
            );
        }

        const totalBillingAmount =
            data.noofSeats * flightData.price;

        const bookingPayload = {
            ...data,
            totalCost: totalBillingAmount
        };

        const booking = await bookingRepository.create(
            bookingPayload,
            transaction
        );

        // await axios.patch(
        //     `${ServerConfig.AEROBOOK_FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,
        //     {
        //         seats: data.noofSeats
        //     }
        // );


      await axios.patch(
    `${ServerConfig.AEROBOOK_FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats/internal`,
    {
        seats: data.noofSeats
    }
);

        await transaction.commit();

        return booking;

    } catch (error) {
        console.log(
            "BOOKING SERVICE ERROR:",
            error.message
        );

        console.log(
            "ERROR CODE:",
            error.code
        );

        await transaction.rollback();
        throw error;
    }
}

//only for simulation without the payment service
// async function makePayment(data) {
//     const transaction = await db.sequelize.transaction();

//     try {
//         const bookingDetails =
//             await bookingRepository.get(
//                 data.bookingId,
//                 transaction
//             );

//         if (bookingDetails.status == CANCELLED) {
//             throw new AppError(
//                 'The booking has expired',
//                 StatusCodes.BAD_REQUEST
//             );
//         }

//         console.log(bookingDetails);

//         const bookingTime =
//             new Date(bookingDetails.createdAt);

//         const currentTime = new Date();

//         if (currentTime - bookingTime > 300000) {
//             await cancelBooking(data.bookingId);

//             throw new AppError(
//                 'The booking has expired',
//                 StatusCodes.BAD_REQUEST
//             );
//         }

//         if (bookingDetails.totalCost != data.totalCost) {
//             throw new AppError(
//                 'The amount of the payment doesnt match',
//                 StatusCodes.BAD_REQUEST
//             );
//         }

//         if (bookingDetails.userId != data.userId) {
//             throw new AppError(
//                 'The user corresponding to the booking doesnt match',
//                 StatusCodes.BAD_REQUEST
//             );
//         }

//         // We assume here that payment is successful
//         await bookingRepository.update(
//             data.bookingId,
//             { status: BOOKED },
//             transaction
//         );

//         await transaction.commit();

//     } catch (error) {
//         await transaction.rollback();
//         throw error;
//     }
// }


async function cancelBooking(bookingId,userId) {
    const transaction =
        await db.sequelize.transaction();

    try {
        const bookingDetails =
            await bookingRepository.get(
                bookingId,
                transaction
            );

        console.log(bookingDetails);

        if (bookingDetails.status == CANCELLED) {
            await transaction.commit();
            return true;
        }
        
         if (bookingDetails.userId !== userId) {
            throw new AppError(
            'You are not authorized to cancel this booking',
             StatusCodes.FORBIDDEN
    );
}
        await axios.patch(
    `${ServerConfig.AEROBOOK_FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats/internal`,
    {
        seats: bookingDetails.noofSeats,
        dec: 0
    }
);

        await bookingRepository.update(
            bookingId,
            { status: CANCELLED },
            transaction
        );

        await transaction.commit();

        await PublishEvent('booking.cancelled', {
        bookingId: bookingDetails.id,
        userId: bookingDetails.userId,
        flightId: bookingDetails.flightId,
        noofSeats: bookingDetails.noofSeats,
        reason: 'Booking cancelled'
});

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}


async function cancelOldBookings() {
    try {
        console.log("Inside service");

        const time =
            new Date(Date.now() - 1000 * 300);

        const response =
            await bookingRepository.cancelOldBookings(time);

        return response;

    } catch (error) {
        console.log(error);
    }
}


async function getBooking(bookingId, userId) {
    const booking = await bookingRepository.get(bookingId);

    if (!booking) {
        throw new AppError(
            'Booking not found',
            StatusCodes.NOT_FOUND
        );
    }

    if (booking.userId !== userId) {
        throw new AppError(
            'You are not authorized to view this booking',
            StatusCodes.FORBIDDEN
        );
    }

    return booking;
}


/*
 * Confirm booking after successful payment
 */
async function confirmBooking(bookingId) {

    const transaction =
        await db.sequelize.transaction();

    try {

        const bookingDetails =
            await bookingRepository.get(
                bookingId,
                transaction
            );

        // Booking doesn't exist
        if (!bookingDetails) {
            throw new AppError(
                'Booking not found',
                StatusCodes.NOT_FOUND
            );
        }

        // Booking was cancelled
        if (bookingDetails.status === CANCELLED) {
            throw new AppError(
                'Cannot confirm a cancelled booking',
                StatusCodes.BAD_REQUEST
            );
        }

        // Booking is already booked
        if (bookingDetails.status === BOOKED) {
            throw new AppError(
                'Booking is already booked',
                StatusCodes.BAD_REQUEST
            );
        }

        console.log(
            "Updating booking status to BOOKED..."
        );

        await bookingRepository.update(
            bookingId,
            {
                status: BOOKED
            },
            transaction
        );

        console.log(
            "Booking update successful"
        );

        await transaction.commit();

        console.log(
            "Transaction committed"
        );

        const updatedBooking =
            await bookingRepository.get(bookingId);

            // Publish booking confirmed event
        await PublishEvent('booking.confirmed', {
         bookingId: updatedBooking.id,
         userId: updatedBooking.userId,
         flightId: updatedBooking.flightId,
         noofSeats: updatedBooking.noofSeats,
         totalCost: updatedBooking.totalCost
});

        return updatedBooking;

    } catch (error) {

        console.error(
            "CONFIRM BOOKING ERROR"
        );

        console.error(
            "Booking ID:",
            bookingId
        );

        console.error(
            "Message:",
            error.message
        );

        await transaction.rollback();

        throw error;
    }
}


module.exports = {
    createBooking,
    
    cancelBooking,
    cancelOldBookings,
    getBooking,
    confirmBooking
};