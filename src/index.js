const express = require('express');

const { ServerConfig, Logger } = require('./config');
const { ConnectRabbitMq } = require('./events');
const apiRoutes = require('./routes');

require('./schedulers/booking-scheduler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    Logger.info('Health check requested');
    res.send('health');
});

const startServer = async () => {
    try {
        await ConnectRabbitMq();

        const server = app.listen(ServerConfig.PORT, () => {
            Logger.info(
                `Successfully started the server on PORT: ${ServerConfig.PORT}`
            );
        });

        server.on('error', (error) => {
            Logger.error(`Server error: ${error.message}`);
        });

    } catch (error) {
        Logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();

