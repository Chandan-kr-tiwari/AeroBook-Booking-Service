const crypto  = require('crypto')

const {
    getChannel,
    EXCHANGE_NAME
} = require("./rabbitmq");

const publishEvent = async (eventType, data) => {

    const event = {
        eventId: crypto.randomUUID(),
        eventType,
        timestamp: new Date().toISOString(),
        version: 1,
        source: "booking-service",
        data
    };

    const channel = getChannel();

    await channel.publish(
        EXCHANGE_NAME,
        eventType,
        Buffer.from(JSON.stringify(event)),
        {
            persistent: true,
            contentType: "application/json"
        }
    );

    console.log(`Event published: ${eventType}`);
};

module.exports = publishEvent;