
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT,
    AEROBOOK_FLIGHT_SERVICE: process.env.AEROBOOK_FLIGHT_SERVICE,
    RABBITMQ_URL:process.env.RABBITMQ_URL
}