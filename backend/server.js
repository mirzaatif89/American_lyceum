const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const STORE_DIR = path.join(DATA_DIR, 'mobile_api_store');
const UPLOAD_DIR = path.join(FRONTEND_DIR, 'uploads', 'mobile');
const JWT_SECRET = process.env.JWT_SECRET || 'american_lyceum_mobile_api_secret';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(STORE_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400
};

const RESERVED_ROUTE_NAMES = new Set(['api', 'health', 'socket.io']);
const COLLECTIONS = [
    { route: 'students', store: 'students', listKey: 'students', itemKey: 'student', prefix: 'STU' },
    { route: 'teachers', store: 'teachers', listKey: 'teachers', itemKey: 'teacher', prefix: 'TCH' },
    { route: 'staff', store: 'staff', listKey: 'staff', itemKey: 'staffMember', prefix: 'STF' },
    { route: 'branches', store: 'branches', listKey: 'branches', itemKey: 'branch', prefix: 'BR' },
    { route: 'messages', store: 'messages', listKey: 'messages', itemKey: 'message', prefix: 'MSG', protected: true },
    { route: 'special-notices', store: 'special_notices', listKey: 'notices', itemKey: 'notice', prefix: 'NTC' },
    { route: 'student-attendance', store: 'student_attendance', listKey: 'attendance', itemKey: 'attendanceRecord', prefix: 'SAT' },
    { route: 'teacher-attendance', store: 'teacher_attendance', listKey: 'attendance', itemKey: 'attendanceRecord', prefix: 'TAT' },
    { route: 'student-results', store: 'student_results', listKey: 'results', itemKey: 'result', prefix: 'RES' },
    { route: 'student-syllabus', store: 'student_syllabus', listKey: 'syllabus', itemKey: 'syllabusItem', prefix: 'SYL' },
    { route: 'student-courses', store: 'student_courses', listKey: 'courses', itemKey: 'course', prefix: 'CRS' },
    { route: 'fees', store: 'fees', listKey: 'fees', itemKey: 'fee', prefix: 'FEE' },
    { route: 'fee-payments', store: 'fee_payments', listKey: 'payments', itemKey: 'payment', prefix: 'PAY' },
    { route: 'teacher-salaries', store: 'teacher_salaries', listKey: 'salaries', itemKey: 'salary', prefix: 'SAL' },
    { route: 'complaints', store: 'complaints', listKey: 'complaints', itemKey: 'complaint', prefix: 'CMP' },
    { route: 'leave-requests', store: 'leave_requests', listKey: 'leaveRequests', itemKey: 'leaveRequest', prefix: 'LEAVE' },
    { route: 'student-diary', store: 'student_diary', listKey: 'diary', itemKey: 'diaryItem', prefix: 'DIA' },
    { route: 'uploaded-assignments', store: 'uploaded_assignments', listKey: 'assignments', itemKey: 'assignment', prefix: 'UASG' },
    { route: 'student-assignments', store: 'student_assignments', listKey: 'assignments', itemKey: 'assignment', prefix: 'SASG' },
    { route: 'uploaded-lectures', store: 'uploaded_lectures', listKey: 'lectures', itemKey: 'lecture', prefix: 'LEC' },
    { route: 'student-quizzes', store: 'student_quizzes', listKey: 'quizzes', itemKey: 'quiz', prefix: 'QUIZ' },
    { route: 'student-quiz-submissions', store: 'student_quiz_submissions', listKey: 'submissions', itemKey: 'submission', prefix: 'QSUB' },
    { route: 'teacher-assigned-classes', store: 'teacher_assigned_classes', listKey: 'assignedClasses', itemKey: 'assignedClass', prefix: 'TCLASS' },
    { route: 'online-admissions', store: 'online_admissions', listKey: 'applications', itemKey: 'application', prefix: 'ADM' },
    { route: 'banners', store: 'banners', listKey: 'banners', itemKey: 'banner', prefix: 'BAN' },
    { route: 'ads', store: 'ads', listKey: 'ads', itemKey: 'ad', prefix: 'AD' },
    { route: 'events', store: 'events', listKey: 'events', itemKey: 'event', prefix: 'EVT' }
];

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

function storePath(storeName) {
    return path.join(STORE_DIR, `${storeName}.json`);
}

function readStore(storeName) {
    const filePath = storePath(storeName);
    if (!fs.existsSync(filePath)) return [];

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

function writeStore(storeName, records) {
    const cleanRecords = Array.isArray(records) ? records : [];
    fs.writeFileSync(storePath(storeName), JSON.stringify(cleanRecords, null, 2));
    return cleanRecords;
}

function readJsonFile(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_error) {
        return fallback;
    }
}

function writeJsonFile(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function publicUrl(req, relativePath) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}${relativePath}`;
}

function cleanString(value) {
    return String(value ?? '').trim();
}

function matchesQuery(record, query) {
    return Object.entries(query || {}).every(([key, value]) => {
        if (['page', 'limit', 'sort'].includes(key)) return true;
        const expected = cleanString(value).toLowerCase();
        if (!expected) return true;
        return cleanString(record?.[key]).toLowerCase() === expected;
    });
}

function filterForUser(records, req) {
    if (!req.user) return records;
    if (['Admin', 'Principal', 'Staff'].includes(req.user.role)) return records;

    return records.filter((record) => {
        const role = cleanString(record.targetRole || record.recipientRole || record.portal || record.role).toLowerCase();
        const scope = cleanString(record.targetScope || record.scope).toLowerCase();
        const recipientId = cleanString(record.recipientId || record.studentId || record.teacherId || record.applicantId || record.senderId);
        const classGrade = cleanString(record.classGrade);

        if (!role && !recipientId && !classGrade) return true;
        if (role && role !== cleanString(req.user.role).toLowerCase() && role !== 'all') return false;
        if (scope === 'all') return true;
        if (recipientId && recipientId !== cleanString(req.user.id)) return false;
        if (classGrade && req.user.classGrade && classGrade !== cleanString(req.user.classGrade)) return false;
        return true;
    });
}

async function passwordMatches(inputPassword, storedPassword, plainPassword) {
    const password = cleanString(inputPassword);
    const stored = cleanString(storedPassword);
    const plain = cleanString(plainPassword);

    if (!password) return false;
    if (plain && password === plain) return true;
    if (!stored) return false;
    if (stored.startsWith('$2')) return bcrypt.compare(password, stored);
    return password === stored;
}

function makeToken(user) {
    return jwt.sign({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        classGrade: user.classGrade || '',
        campusName: user.campusName || ''
    }, JWT_SECRET, { expiresIn: '1d' });
}

function publicUser(user) {
    const { password, plainPassword, ...safeUser } = user || {};
    return safeUser;
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
    } catch (_error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
}

function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return next();

    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (_error) {
        req.user = null;
    }
    return next();
}

function findAccount(username) {
    const normalized = cleanString(username).toLowerCase();
    const sources = [
        ...readStore('users').map((record) => ({ ...record, role: record.role || 'User' })),
        ...readStore('students').map((record) => ({ ...record, role: 'Student' })),
        ...readStore('teachers').map((record) => ({ ...record, role: 'Teacher' })),
        ...readStore('staff').map((record) => ({ ...record, role: record.role || 'Staff' }))
    ];

    return sources.find((record) => {
        const recordUsername = cleanString(record.username).toLowerCase();
        const recordEmail = cleanString(record.email).toLowerCase();
        return recordUsername === normalized || recordEmail === normalized;
    });
}

function upsertRecord(config, body, idOverride) {
    const records = readStore(config.store);
    const id = cleanString(idOverride || body?.id) || generateId(config.prefix);
    const index = records.findIndex((record) => cleanString(record.id) === id);
    const now = new Date().toISOString();
    const record = {
        ...(index >= 0 ? records[index] : { createdAt: now }),
        ...(body || {}),
        id,
        updatedAt: now
    };

    if (index >= 0) records[index] = record;
    else records.unshift(record);

    writeStore(config.store, records);
    return { record, records };
}

function normalizeCollectionPayload(config, payload, req) {
    const record = { ...(payload || {}) };
    const now = new Date().toISOString();

    if (config.route === 'leave-requests') {
        const isTeacher = req.user?.role === 'Teacher';
        const isStudent = req.user?.role === 'Student';
        if ((isTeacher || isStudent) && !record.applicantId && !record.teacherId && !record.studentId) {
            record.applicantId = req.user.id;
            record.applicantRole = req.user.role;
            record.applicantName = req.user.fullName || req.user.username || req.user.role;
            if (isTeacher) {
                record.teacherId = req.user.id;
                record.teacherName = record.applicantName;
            }
            if (isStudent) {
                record.studentId = req.user.id;
                record.studentName = record.applicantName;
                record.classGrade = req.user.classGrade || record.classGrade || '';
            }
        }
        record.status = record.status || 'Pending';
        record.createdAt = record.createdAt || now;
    }

    if (config.route === 'complaints') {
        if (req.user && !record.senderId) {
            record.senderId = req.user.id;
            record.senderRole = req.user.role;
            record.senderName = req.user.fullName || req.user.username || req.user.role;
        }
        record.status = record.status || 'Pending';
        record.createdAt = record.createdAt || now;
    }

    return record;
}

function mergeTeacherSalaryRecords(records) {
    return records.reduce((acc, record) => {
        if (record?.salaries && typeof record.salaries === 'object' && !Array.isArray(record.salaries)) {
            Object.assign(acc, record.salaries);
            return acc;
        }
        const teacherId = cleanString(record.teacherId || record.employeeId || record.id);
        const month = cleanString(record.month || record.monthKey);
        if (teacherId && month) {
            acc[`teacher_${teacherId}_${month}`] = record;
        }
        return acc;
    }, {});
}

function registerCollection(config) {
    const basePath = `/api/${config.route}`;
    const authMiddleware = config.protected ? authenticateToken : optionalAuth;

    app.get(basePath, authMiddleware, (req, res) => {
        const records = filterForUser(readStore(config.store), req).filter((record) => matchesQuery(record, req.query));
        if (config.route === 'teacher-salaries') {
            return res.json({ success: true, salaries: mergeTeacherSalaryRecords(records), salaryRecords: records });
        }
        res.json({ success: true, [config.listKey]: records });
    });

    app.post(basePath, authMiddleware, (req, res) => {
        const payloads = Array.isArray(req.body) ? req.body : [req.body || {}];
        const saved = payloads.map((payload) => upsertRecord(config, normalizeCollectionPayload(config, payload, req)).record);
        const records = readStore(config.store);
        if (config.route === 'teacher-salaries') {
            return res.json({
                success: true,
                [config.itemKey]: saved.length === 1 ? saved[0] : saved,
                salaries: mergeTeacherSalaryRecords(records),
                salaryRecords: records
            });
        }
        res.json({
            success: true,
            [config.itemKey]: saved.length === 1 ? saved[0] : saved,
            [config.listKey]: records
        });
    });

    app.get(`${basePath}/:id`, authMiddleware, (req, res) => {
        const record = readStore(config.store).find((item) => cleanString(item.id) === cleanString(req.params.id));
        if (!record) return res.status(404).json({ success: false, message: `${config.itemKey} not found.` });
        return res.json({ success: true, [config.itemKey]: record });
    });

    app.put(`${basePath}/:id`, authMiddleware, (req, res) => {
        const result = upsertRecord(config, req.body || {}, req.params.id);
        res.json({ success: true, [config.itemKey]: result.record, [config.listKey]: result.records });
    });

    app.patch(`${basePath}/:id`, authMiddleware, (req, res) => {
        const result = upsertRecord(config, req.body || {}, req.params.id);
        res.json({ success: true, [config.itemKey]: result.record, [config.listKey]: result.records });
    });

    app.post(`${basePath}/:id`, authMiddleware, (req, res) => {
        const result = upsertRecord(config, req.body || {}, req.params.id);
        res.json({ success: true, [config.itemKey]: result.record, [config.listKey]: result.records });
    });

    app.delete(`${basePath}/:id`, authMiddleware, (req, res) => {
        const records = readStore(config.store);
        const nextRecords = records.filter((record) => cleanString(record.id) !== cleanString(req.params.id));
        if (nextRecords.length === records.length) {
            return res.status(404).json({ success: false, message: `${config.itemKey} not found.` });
        }

        writeStore(config.store, nextRecords);
        return res.json({ success: true, [config.listKey]: nextRecords });
    });
}

function getApiCatalog(req) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api`;
    const collectionEndpoints = COLLECTIONS.flatMap((config) => [
        { method: 'GET', path: `/api/${config.route}`, description: `List ${config.listKey}` },
        { method: 'POST', path: `/api/${config.route}`, description: `Create or upsert ${config.itemKey}` },
        { method: 'GET', path: `/api/${config.route}/:id`, description: `Get one ${config.itemKey}` },
        { method: 'PUT/PATCH/POST', path: `/api/${config.route}/:id`, description: `Update one ${config.itemKey}` },
        { method: 'DELETE', path: `/api/${config.route}/:id`, description: `Delete one ${config.itemKey}` }
    ]);

    return {
        baseUrl,
        version: '2026-07-29',
        auth: {
            login: 'POST /api/login',
            bearerHeader: 'Authorization: Bearer <token>',
            tokenExpiry: '1 day'
        },
        endpoints: [
            { method: 'GET', path: '/api/health', description: 'API health check' },
            { method: 'GET', path: '/api/catalog', description: 'Machine-readable API list' },
            { method: 'POST', path: '/api/login', description: 'Login with admin, student, teacher, staff, or users store credentials' },
            { method: 'POST', path: '/api/session/heartbeat', description: 'Protected token heartbeat' },
            { method: 'POST', path: '/api/session/end', description: 'Protected logout endpoint' },
            { method: 'GET', path: '/api/student/me', description: 'Student profile from bearer token' },
            { method: 'POST', path: '/api/student/me', description: 'Update student portal profile fields' },
            { method: 'GET', path: '/api/teacher/me', description: 'Teacher profile from bearer token' },
            { method: 'GET', path: '/api/about-software', description: 'Mobile app about screen data' },
            { method: 'POST', path: '/api/about-software', description: 'Update mobile app about screen data' },
            { method: 'POST', path: '/api/upload', description: 'Upload multipart file or JSON base64/dataUrl' },
            { method: 'GET', path: '/api/fees/due-balances', description: 'Due balance map/list' },
            { method: 'POST', path: '/api/fees/due-balances', description: 'Save due balance record' },
            { method: 'GET', path: '/api/date-sheet', description: 'Date sheet data' },
            { method: 'POST', path: '/api/date-sheet', description: 'Replace date sheet data' },
            ...collectionEndpoints
        ]
    };
}

function getAboutSoftware(req) {
    const defaultAbout = {
        id: 'ABOUT-SOFTWARE',
        appName: 'American Lyceum',
        schoolName: 'American Lyceum School',
        website: publicUrl(req, '/'),
        supportEmail: process.env.SMTP_FROM_EMAIL || 'americanlyceumschoolsharaqpurc@gmail.com',
        supportPhone: '03174944258',
        schoolAddress: 'Main tehsil Road near post office Sharaqpur Sharif district sheikhupura',
        principalName: 'Mahmood ul Hassan',
        description: 'Student and teacher portal APIs for American Lyceum School Sharaqpur.',
        version: '1.0.0',
        socialLinks: {
            whatsapp: 'https://wa.me/923174944258',
            facebook: 'https://www.facebook.com/share/1G3KJEo1VY/?mibextid=wwXIfr',
            instagram: 'https://www.instagram.com/alis_000908?igsh=MWw2eXV0ODZnMG1xaw==',
            youtube: 'https://youtube.com/@alis579?si=_mBP5tWp12y2AA60'
        }
    };
    return readStore('about_software')[0] || defaultAbout;
}

function safeUploadName(originalName) {
    const parsed = path.parse(cleanString(originalName) || 'upload.bin');
    const base = parsed.name.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'upload';
    const ext = parsed.ext.replace(/[^a-z0-9.]/gi, '').slice(0, 16) || '.bin';
    return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`;
}

function saveUpload(req, category, fileName, mimeType, buffer) {
    const cleanCategory = (cleanString(category) || 'general').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
    const uploadFolder = path.join(UPLOAD_DIR, cleanCategory);
    fs.mkdirSync(uploadFolder, { recursive: true });

    const safeName = safeUploadName(fileName);
    const absolutePath = path.join(uploadFolder, safeName);
    fs.writeFileSync(absolutePath, buffer);

    const relativeUrl = `/uploads/mobile/${cleanCategory}/${safeName}`;
    return {
        url: publicUrl(req, relativeUrl),
        relativeUrl,
        fileName: safeName,
        originalName: fileName,
        mimeType,
        size: buffer.length,
        category: cleanCategory
    };
}

function parseDataUrl(value) {
    const match = cleanString(value).match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!match) return null;
    return {
        mimeType: match[1] || 'application/octet-stream',
        base64: match[3] || ''
    };
}

function readRawRequestBuffer(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function parseMultipart(buffer, contentType) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) throw new Error('Multipart boundary missing.');

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const delimiter = Buffer.from(`--${boundary}`);
    const fields = {};
    const files = [];
    let offset = 0;

    while (offset < buffer.length) {
        const start = buffer.indexOf(delimiter, offset);
        if (start < 0) break;
        const next = buffer.indexOf(delimiter, start + delimiter.length);
        if (next < 0) break;

        const part = buffer.subarray(start + delimiter.length + 2, next - 2);
        offset = next;
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd < 0) continue;

        const header = part.subarray(0, headerEnd).toString('utf8');
        const body = part.subarray(headerEnd + 4);
        const name = header.match(/name="([^"]+)"/i)?.[1] || '';
        const fileName = header.match(/filename="([^"]*)"/i)?.[1] || '';
        const mimeType = header.match(/content-type:\s*([^\r\n]+)/i)?.[1] || 'application/octet-stream';

        if (!name) continue;
        if (fileName) files.push({ fieldName: name, fileName, mimeType, buffer: body });
        else fields[name] = body.toString('utf8');
    }

    return { fields, files };
}

function seedDefaultData() {
    const aboutPath = storePath('about_software');
    if (!fs.existsSync(aboutPath)) {
        writeStore('about_software', [{
            id: 'ABOUT-SOFTWARE',
            appName: 'American Lyceum',
            schoolName: 'American Lyceum School',
            supportEmail: process.env.SMTP_FROM_EMAIL || 'americanlyceumschoolsharaqpurc@gmail.com',
            supportPhone: '03174944258',
            schoolAddress: 'Main tehsil Road near post office Sharaqpur Sharif district sheikhupura',
            principalName: 'Mahmood ul Hassan',
            version: '1.0.0',
            socialLinks: {
                whatsapp: 'https://wa.me/923174944258',
                facebook: 'https://www.facebook.com/share/1G3KJEo1VY/?mibextid=wwXIfr',
                instagram: 'https://www.instagram.com/alis_000908?igsh=MWw2eXV0ODZnMG1xaw==',
                youtube: 'https://youtube.com/@alis579?si=_mBP5tWp12y2AA60'
            }
        }]);
    }

    const eventsPath = storePath('events');
    if (!fs.existsSync(eventsPath)) {
        writeStore('events', [
            {
                id: 'EVT-ANNUAL-STAGE',
                title: 'Stage Performance',
                description: 'Group performance with colorful annual function stage setup.',
                imageUrl: '/images/Ecents/WhatsApp Image 2026-07-29 at 12.43.43 PM.jpeg',
                displayOrder: 1,
                isActive: true
            },
            {
                id: 'EVT-CLASS-PRESENTATION',
                title: 'Class Presentation',
                description: 'Students ready for school event participation.',
                imageUrl: '/images/Ecents/WhatsApp Image 2026-07-29 at 12.43.35 PM.jpeg',
                displayOrder: 2,
                isActive: true
            },
            {
                id: 'EVT-CULTURAL-SEGMENT',
                title: 'Cultural Segment',
                description: 'Coordinated costume and team activity.',
                imageUrl: '/images/Ecents/WhatsApp Image 2026-07-29 at 12.43.36 PM.jpeg',
                displayOrder: 3,
                isActive: true
            },
            {
                id: 'EVT-GRADUATION-MOMENT',
                title: 'Graduation Moment',
                description: 'Student achievement and celebration photo.',
                imageUrl: '/images/Ecents/WhatsApp Image 2026-07-29 at 12.43.51 PM (4).jpeg',
                displayOrder: 4,
                isActive: true
            },
            {
                id: 'EVT-STUDENT-HOSTING',
                title: 'Student Hosting',
                description: 'Confidence building through public speaking.',
                imageUrl: '/images/Ecents/WhatsApp Image 2026-07-29 at 5.22.10 PM.jpeg',
                displayOrder: 5,
                isActive: true
            }
        ]);
    }
}

seedDefaultData();

app.get('/api', (req, res) => {
    res.json({ success: true, message: 'American Lyceum API is running.', catalog: `${req.protocol}://${req.get('host')}/api/catalog` });
});

app.get(['/api/health', '/api/ping'], (_req, res) => {
    res.json({ success: true, apiEnabled: true, timestamp: new Date().toISOString() });
});

app.get(['/api/catalog', '/api/mobile-api-list'], (req, res) => {
    res.json({ success: true, ...getApiCatalog(req) });
});

app.post('/api/login', async (req, res) => {
    const username = cleanString(req.body?.username);
    const password = cleanString(req.body?.password);

    const adminUsername = cleanString(process.env.ADMIN_USERNAME || 'admin');
    const adminPassword = cleanString(process.env.ADMIN_PASSWORD || '');
    const principalUsername = cleanString(process.env.PRINCIPAL_USERNAME || 'principal@school.com');
    const principalPassword = cleanString(process.env.PRINCIPAL_PASSWORD || '');

    let user = null;
    if (username && password && username.toLowerCase() === adminUsername.toLowerCase() && password === adminPassword) {
        user = { id: 'admin', username: adminUsername, role: 'Admin', fullName: 'Administrator', campusName: 'Sharaqpur Campus' };
    } else if (username && password && username.toLowerCase() === principalUsername.toLowerCase() && password === principalPassword) {
        user = { id: 'principal', username: principalUsername, role: 'Principal', fullName: 'Mahmood ul Hassan', campusName: 'Sharaqpur Campus' };
    } else {
        const account = findAccount(username);
        if (account && await passwordMatches(password, account.password, account.plainPassword)) {
            user = {
                ...account,
                role: account.role || 'User',
                fullName: account.fullName || account.name || account.username
            };
        }
    }

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const safeUser = publicUser(user);
    return res.json({
        success: true,
        token: makeToken(safeUser),
        user: safeUser,
        permissions: { role: safeUser.role, access: 'mobile' }
    });
});

app.post('/api/session/heartbeat', authenticateToken, (req, res) => {
    res.json({ success: true, online: true, user: req.user, timestamp: new Date().toISOString() });
});

app.post('/api/session/end', authenticateToken, (_req, res) => {
    res.json({ success: true, message: 'Session ended.' });
});

app.get('/api/student/me', authenticateToken, (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ success: false, message: 'Student access only.' });
    const student = readStore('students').find((record) => cleanString(record.id) === cleanString(req.user.id));
    res.json({ success: true, student: publicUser(student || req.user) });
});

app.post(['/api/student/me', '/api/student/profile'], authenticateToken, (req, res) => {
    if (req.user.role !== 'Student') return res.status(403).json({ success: false, message: 'Student access only.' });
    const students = readStore('students');
    const index = students.findIndex((record) => cleanString(record.id) === cleanString(req.user.id));
    const existing = index >= 0 ? students[index] : req.user;
    const allowedUpdates = {};
    ['profileImage', 'phone', 'email', 'address', 'guardianContact'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
            allowedUpdates[key] = req.body[key];
        }
    });
    const student = {
        ...existing,
        ...allowedUpdates,
        id: existing.id || req.user.id,
        role: 'Student',
        updatedAt: new Date().toISOString()
    };
    if (index >= 0) students[index] = student;
    else students.unshift(student);
    writeStore('students', students);
    res.json({ success: true, student: publicUser(student) });
});

app.get('/api/teacher/me', authenticateToken, (req, res) => {
    if (req.user.role !== 'Teacher') return res.status(403).json({ success: false, message: 'Teacher access only.' });
    const teacher = readStore('teachers').find((record) => cleanString(record.id) === cleanString(req.user.id));
    res.json({ success: true, teacher: publicUser(teacher || req.user) });
});

app.post(['/api/teacher/me', '/api/teacher/profile'], authenticateToken, (req, res) => {
    if (req.user.role !== 'Teacher') return res.status(403).json({ success: false, message: 'Teacher access only.' });
    const teachers = readStore('teachers');
    const index = teachers.findIndex((record) => cleanString(record.id) === cleanString(req.user.id));
    const existing = index >= 0 ? teachers[index] : req.user;
    const allowedUpdates = {};
    ['profileImage', 'phone', 'email', 'address'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
            allowedUpdates[key] = req.body[key];
        }
    });
    const teacher = {
        ...existing,
        ...allowedUpdates,
        id: existing.id || req.user.id,
        role: 'Teacher',
        updatedAt: new Date().toISOString()
    };
    if (index >= 0) teachers[index] = teacher;
    else teachers.unshift(teacher);
    writeStore('teachers', teachers);
    res.json({ success: true, teacher: publicUser(teacher) });
});

app.get('/api/about-software', (req, res) => {
    res.json({ success: true, aboutSoftware: getAboutSoftware(req) });
});

app.post('/api/about-software', optionalAuth, (req, res) => {
    const record = { ...getAboutSoftware(req), ...(req.body || {}), id: 'ABOUT-SOFTWARE', updatedAt: new Date().toISOString() };
    writeStore('about_software', [record]);
    res.json({ success: true, aboutSoftware: record });
});

app.get('/api/date-sheet', (_req, res) => {
    const dateSheet = readJsonFile(path.join(DATA_DIR, 'date_sheet.json'), []);
    res.json({ success: true, dateSheet });
});

app.post('/api/date-sheet', optionalAuth, (req, res) => {
    const dateSheet = Array.isArray(req.body) ? req.body : (req.body?.dateSheet || req.body || []);
    writeJsonFile(path.join(DATA_DIR, 'date_sheet.json'), dateSheet);
    res.json({ success: true, dateSheet });
});

app.get('/api/fees/payments', optionalAuth, (req, res) => {
    const payments = filterForUser(readStore('fee_payments'), req).filter((record) => matchesQuery(record, req.query));
    res.json({ success: true, payments });
});

app.get('/api/fees/due-balances', optionalAuth, (req, res) => {
    const dueBalances = filterForUser(readStore('fee_due_balances'), req).filter((record) => matchesQuery(record, req.query));
    const balances = dueBalances.reduce((acc, record) => {
        const studentId = cleanString(record.studentId || record.id);
        if (studentId) acc[studentId] = Number(record.balance || 0);
        return acc;
    }, {});
    res.json({ success: true, balances, dueBalances });
});

app.post('/api/fees/due-balances', optionalAuth, (req, res) => {
    const config = { route: 'fees/due-balances', store: 'fee_due_balances', listKey: 'dueBalances', itemKey: 'dueBalance', prefix: 'DUE' };
    const result = upsertRecord(config, req.body || {}, req.body?.studentId || req.body?.id);
    res.json({ success: true, dueBalance: result.record, dueBalances: result.records });
});

app.post('/api/upload', async (req, res) => {
    try {
        const contentType = cleanString(req.headers['content-type']).toLowerCase();
        let fields = req.body || {};
        let file = null;

        if (contentType.includes('multipart/form-data')) {
            const parsed = parseMultipart(await readRawRequestBuffer(req), contentType);
            fields = parsed.fields;
            file = parsed.files[0] || null;
        } else {
            const dataUrl = parseDataUrl(fields.dataUrl);
            const base64 = dataUrl?.base64 || fields.base64 || '';
            if (base64) {
                file = {
                    fileName: fields.fileName || 'upload.bin',
                    mimeType: dataUrl?.mimeType || fields.mimeType || 'application/octet-stream',
                    buffer: Buffer.from(String(base64).replace(/\s/g, ''), 'base64')
                };
            }
        }

        if (!file?.buffer?.length) {
            return res.status(400).json({ success: false, message: 'Upload file is required.' });
        }

        if (file.buffer.length > 15 * 1024 * 1024) {
            return res.status(413).json({ success: false, message: 'Upload size must be 15MB or less.' });
        }

        const uploadedFile = saveUpload(req, fields.category, file.fileName, file.mimeType, file.buffer);
        res.json({ success: true, file: uploadedFile, url: uploadedFile.url });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'File upload failed.' });
    }
});

COLLECTIONS.forEach(registerCollection);

app.get('/health', (_req, res) => {
    res.json({ success: true, apiEnabled: true, timestamp: new Date().toISOString() });
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
    seedDefaultData();
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
        console.log(`American Lyceum API and frontend server running on port ${PORT}.`);
    });
}
