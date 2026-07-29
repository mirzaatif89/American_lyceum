const { server, startServer } = require('./backend/server');

const PORT = Number(process.env.PORT || 3000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`American Lyceum API and frontend server running on port ${PORT}.`);
    startServer().catch((err) => {
        console.error('Startup background initialization failed:', err?.message || err);
    });
});
