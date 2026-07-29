const { server, startServer } = require('./backend/server');

const PORT = Number(process.env.PORT || 3000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Static frontend server running on port ${PORT}. Old APIs are removed.`);
    startServer().catch((err) => {
        console.error('Startup background initialization failed:', err?.message || err);
    });
});
