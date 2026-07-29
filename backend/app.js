const { server, startServer } = require('./server');

const PORT = Number(process.env.PORT || 3000);

startServer()
    .then(() => {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Static frontend server running on port ${PORT}. Old APIs are removed.`);
        });
    })
    .catch((err) => {
        console.error('Startup failed:', err?.message || err);
        process.exit(1);
    });
