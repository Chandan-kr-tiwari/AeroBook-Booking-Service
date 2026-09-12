const {ServerConfig} = require('../config')

const amqp = require('amqplib')

let channel;
const EXCHANGE_NAME = "app.events";

const connectRabbitMQ = async () => {
    const connection = await amqp.connect(
        process.env.RABBITMQ_URL
    );

    channel = await connection.createChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        { durable: true }
    );

    console.log("Connected to RabbitMQ");
};

const getChannel = () => channel;

module.exports = {
    connectRabbitMQ,
    getChannel,
    EXCHANGE_NAME
};