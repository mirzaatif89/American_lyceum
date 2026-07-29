const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const cors = require('cors');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');

const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400
};

const RESERVED_ROUTE_NAMES = new Set(['api', 'health', 'socket.io']);

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

function resolvePageFileByRoute(routeName = '') {
    const normalized = String(routeName || '').trim().toLowerCase();
    if (!normalized || RESERVED_ROUTE_NAMES.has(normalized)) return '';
    if (normalized === 'login') return 'login.html';
    if (normalized === 'index' || normalized === 'website') return 'index.html';
    if (!/^[a-z0-9_-]+$/i.test(normalized)) return '';

    const candidate = `${normalized}.html`;
    return fs.existsSync(path.join(FRONTEND_DIR, candidate)) ? candidate : '';
}

function sendApisRemoved(_req, res) {
    res.status(410).json({
        success: false,
        message: 'Old APIs have been removed. New APIs are not configured yet.'
    });
}

app.use('/api', sendApisRemoved);

app.get('/health', (_req, res) => {
    res.json({
        success: true,
        apiEnabled: false,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/:pageName([a-zA-Z0-9_-]+).html', (req, res, next) => {
    const pageName = String(req.params.pageName || '').toLowerCase();
    if (RESERVED_ROUTE_NAMES.has(pageName)) return next();

    const targetRoute = pageName === 'index' || pageName === 'website' ? '' : pageName;
    const targetFile = resolvePageFileByRoute(targetRoute);
    if (!targetFile && targetRoute) return next();

    return res.redirect(302, targetRoute ? `/${targetRoute}` : '/');
});

app.get('/:routeName([a-zA-Z0-9_-]+)', (req, res, next) => {
    const pageFile = resolvePageFileByRoute(req.params.routeName);
    if (!pageFile) return next();
    return res.sendFile(path.join(FRONTEND_DIR, pageFile));
});

app.use(express.static(FRONTEND_DIR));

function startServer() {
    return Promise.resolve();
}

module.exports = {
    app,
    startServer,
    server
};

if (require.main === module) {
    const PORT = Number(process.env.PORT || 3001);
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Static frontend server running on port ${PORT}. Old APIs are removed.`);
    });
}
