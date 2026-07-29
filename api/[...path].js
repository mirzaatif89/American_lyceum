const { app, startServer } = require('../backend/server');

let readyPromise = null;

module.exports = async (req, res) => {
    if (!readyPromise) readyPromise = startServer();
    await readyPromise;
    return app(req, res);
};
