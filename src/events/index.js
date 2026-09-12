const {
    connectRabbitMQ
} = require('./rabbitmq');

const PublishEvent = require('./publisher');

module.exports = {
    ConnectRabbitMq: connectRabbitMQ,
    PublishEvent
};