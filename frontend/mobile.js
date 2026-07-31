const MOBILE_STORAGE_KEYS = {
    user: 'loggedInUser',
    token: 'eduCore_token',
    sessionId: 'eduCore_session_id',
    permissions: 'eduCore_permissions_config'
};

const MODULE_LIBRARY = [
    { key: 'dashboard', label: 'Dashboard', description: 'Live summary and shortcuts', icon: 'layout-dashboard', path: '/dashboard.html', bucket: 'admin', accent: '#4cc9f0' },
    { key: 'students', label: 'Students', description: 'Add, edit, and manage records', icon: 'users', path: '/students.html', bucket: 'admin', accent: '#34d399' },
    { key: 'teachers', label: 'Teachers', description: 'Teacher records and profiles', icon: 'book-open', path: '/teachers.html', bucket: 'admin', accent: '#8b5cf6' },
    { key: 'staff', label: 'Staff', description: 'Office and support staff', icon: 'briefcase', path: '/staff.html', bucket: 'admin', accent: '#f59e0b' },
    { key: 'classes', label: 'Classes', description: 'Sections, groups, and classes', icon: 'school', path: '/classes.html', bucket: 'admin', accent: '#22c55e' },
    { key: 'fees', label: 'Fees', description: 'Fee setup and payment flow', icon: 'credit-card', path: '/fees.html', bucket: 'admin', accent: '#06b6d4' },
    { key: 'fee_challan', label: 'Fee Challan', description: 'Generate and share challans', icon: 'file-text', path: '/fee_challan.html', bucket: 'admin', accent: '#ef4444' },
    { key: 'revenue', label: 'Revenue', description: 'Income, collection, and balance', icon: 'trending-up', path: '/revenue.html', bucket: 'finance', accent: '#10b981' },
    { key: 'finance', label: 'Finance', description: 'Bills and expenses', icon: 'receipt', path: '/finance.html', bucket: 'finance', accent: '#f97316' },
    { key: 'teacher_salaries', label: 'Salaries', description: 'Payroll and salary records', icon: 'wallet', path: '/teacher_salaries.html', bucket: 'finance', accent: '#a855f7' },
    { key: 'messages', label: 'Messages', description: 'School communication inbox', icon: 'message-circle', path: '/messages.html', bucket: 'all', accent: '#38bdf8' },
    { key: 'notifications', label: 'Notifications', description: 'Alerts and announcements', icon: 'bell', path: '/notifications.html', bucket: 'all', accent: '#f59e0b' },
    { key: 'special_notices', label: 'Special Notices', description: 'Teacher and student notices', icon: 'megaphone', path: '/special_notices.html', bucket: 'all', accent: '#fb7185' },
    { key: 'permissions', label: 'Permissions', description: 'Access control setup', icon: 'shield', path: '/permissions.html', bucket: 'admin', accent: '#22c55e' },
    { key: 'settings', label: 'Settings', description: 'System preferences and setup', icon: 'settings', path: '/settings.html', bucket: 'admin', accent: '#94a3b8' },
    { key: 'student_portal', label: 'Student Portal', description: 'Student dashboard and tools', icon: 'graduation-cap', path: '/student_portal.html', bucket: 'student', accent: '#4cc9f0' },
    { key: 'teacher_portal', label: 'Teacher Portal', description: 'Teacher dashboard and tools', icon: 'book-open', path: '/teacher_portal.html', bucket: 'teacher', accent: '#34d399' },
    { key: 'student_attendance', label: 'Student Attendance', description: 'Attendance marking and review', icon: 'calendar-check', path: '/student_attendance.html', bucket: 'teacher', accent: '#06b6d4' },
    { key: 'teacher_attendance', label: 'Teacher Attendance', description: 'Teacher presence and logs', icon: 'clipboard-check', path: '/teacher_attendance.html', bucket: 'admin', accent: '#8b5cf6' },
    { key: 'student_attendance_report', label: 'Attendance Report', description: 'Attendance analysis and reports', icon: 'bar-chart-3', path: '/student_attendance_report.html', bucket: 'teacher', accent: '#10b981' },
    { key: 'teacher_attendance_report', label: 'Teacher Report', description: 'Staff attendance analytics', icon: 'line-chart', path: '/teacher_attendance_report.html', bucket: 'admin', accent: '#f59e0b' },
    { key: 'assigned_classes', label: 'Assigned Classes', description: 'Class allocation for teachers', icon: 'school', path: '/teacher_assigned_classes.html', bucket: 'teacher', accent: '#14b8a6' },
    { key: 'student_leave_requests', label: 'Student Leave', description: 'Leave requests for students', icon: 'calendar-check', path: '/student_leave_requests.html', bucket: 'student', accent: '#fb7185' },
    { key: 'teacher_leave_requests', label: 'Teacher Leave', description: 'Leave requests for teachers', icon: 'calendar-check', path: '/teacher_leave_requests.html', bucket: 'teacher', accent: '#fb7185' },
    { key: 'assignments', label: 'Assignments', description: 'Homework and submissions', icon: 'file-up', path: '/assignments.html', bucket: 'student', accent: '#f97316' },
    { key: 'lectures', label: 'Lectures', description: 'Class lecture uploads', icon: 'presentation', path: '/lecture_uploading.html', bucket: 'teacher', accent: '#8b5cf6' },
    { key: 'quizzes', label: 'Quizzes', description: 'Quiz creation and attempts', icon: 'circle-help', path: '/quiz_uploading.html', bucket: 'teacher', accent: '#22c55e' },
    { key: 'diary', label: 'Diary', description: 'Daily class diary notes', icon: 'book-open', path: '/student_diary.html', bucket: 'student', accent: '#4cc9f0' },
    { key: 'about', label: 'About Us', description: 'School and software info', icon: 'info', path: '/aboutme.html', bucket: 'all', accent: '#e879f9' }
];

const HEARTBEAT_MS = 30000;
let heartbeatTimer = null;
let activeSession = null;
let activeBucket = 'staff';

function resolveApiBaseUrl() {
    const meta = document.querySelector('meta[name="mobile-api-base"]')?.content?.trim();
    if (meta) return meta.replace(/\/+$/, '');

    if (window.MOBILE_API_BASE_URL) {
        return String(window.MOBILE_API_BASE_URL).replace(/\/+$/, '');
    }

    const hostname = window.location.hostname || '';
    const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
    if (window.location.protocol === 'file:') return 'https://alis.eduzeeno.com';
    if (localHost) return `${window.location.protocol}//${window.location.host || 'localhost:3000'}`;
    return window.location.origin;
}

const API_BASE_URL = `${resolveApiBaseUrl().replace(/\/+$/, '')}/api`;

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getInitials(value) {
    const text = String(value || '').trim();
    const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return 'AL';
    return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function getRoleBucket(user = {}) {
    const role = String(user.role || '').trim().toLowerCase();
    const groupKey = String(user.groupKey || '').trim().toLowerCase();
    if (['admin', 'principal', 'superadmin'].includes(role) || ['admin', 'principal', 'superadmin'].includes(groupKey)) return 'admin';
    if (groupKey === 'accountant') return 'finance';
    if (role === 'teacher' || ['teacher', 'senior_teacher', 'coordinator'].includes(groupKey)) return 'teacher';
    if (role === 'student') return 'student';
    return 'staff';
}

function getRoleLabel(user = {}) {
    const role = String(user.role || '').trim();
    const groupKey = String(user.groupKey || '').trim().toLowerCase();
    if (groupKey === 'superadmin' || role.toLowerCase() === 'admin') return 'Super Admin / Admin';
    if (role.toLowerCase() === 'principal') return 'Principal';
    if (groupKey === 'accountant') return 'Accountant';
    if (role.toLowerCase() === 'teacher') return 'Teacher';
    if (role.toLowerCase() === 'student') return 'Student';
    if (role.toLowerCase() === 'staff') return 'Staff';
    return role || 'User';
}

function buildAllowedModules(bucket, user = {}) {
    const isAdmin = bucket === 'admin';
    const isFinance = bucket === 'finance';
    const isTeacher = bucket === 'teacher';
    const isStudent = bucket === 'student';
    const isStaff = bucket === 'staff';

    return MODULE_LIBRARY.filter((module) => {
        if (module.bucket === 'all') return true;
        if (isAdmin) return true;
        if (isFinance) return ['finance', 'admin'].includes(module.bucket) || module.key === 'about';
        if (isTeacher) return ['teacher', 'all'].includes(module.bucket);
        if (isStudent) return ['student', 'all'].includes(module.bucket);
        if (isStaff) return ['all'].includes(module.bucket);
        return false;
    }).map((module) => {
        const accessLabel = isAdmin ? 'Full' : isFinance ? 'Finance' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'Basic';
        return {
            ...module,
            accessLabel,
            bucketLabel: getRoleLabel(user)
        };
    });
}

function setActiveView(showDashboard) {
    document.getElementById('heroPanel')?.classList.toggle('hidden', showDashboard);
    document.getElementById('dashboardPanel')?.classList.toggle('hidden', !showDashboard);
    document.getElementById('bottomNav')?.classList.toggle('hidden', !showDashboard);
    document.getElementById('logoutButton')?.classList.toggle('hidden', !showDashboard);
}

function saveSession(session, remember = false) {
    if (!session) return;
    sessionStorage.setItem(MOBILE_STORAGE_KEYS.user, JSON.stringify(session.user || {}));
    sessionStorage.setItem(MOBILE_STORAGE_KEYS.token, session.token || '');
    if (session.sessionId) sessionStorage.setItem(MOBILE_STORAGE_KEYS.sessionId, session.sessionId);
    if (session.permissions) sessionStorage.setItem(MOBILE_STORAGE_KEYS.permissions, JSON.stringify(session.permissions));

    if (remember) {
        localStorage.setItem(MOBILE_STORAGE_KEYS.user, JSON.stringify(session.user || {}));
        localStorage.setItem(MOBILE_STORAGE_KEYS.token, session.token || '');
        if (session.sessionId) localStorage.setItem(MOBILE_STORAGE_KEYS.sessionId, session.sessionId);
        if (session.permissions) localStorage.setItem(MOBILE_STORAGE_KEYS.permissions, JSON.stringify(session.permissions));
    } else {
        localStorage.removeItem(MOBILE_STORAGE_KEYS.user);
        localStorage.removeItem(MOBILE_STORAGE_KEYS.token);
        localStorage.removeItem(MOBILE_STORAGE_KEYS.sessionId);
        localStorage.removeItem(MOBILE_STORAGE_KEYS.permissions);
    }
}

function loadStoredSession() {
    const sessionUser = sessionStorage.getItem(MOBILE_STORAGE_KEYS.user);
    const sessionToken = sessionStorage.getItem(MOBILE_STORAGE_KEYS.token);
    const localUser = localStorage.getItem(MOBILE_STORAGE_KEYS.user);
    const localToken = localStorage.getItem(MOBILE_STORAGE_KEYS.token);

    const userRaw = sessionUser || localUser;
    const token = sessionToken || localToken;
    if (!userRaw || !token) return null;

    let user = null;
    try {
        user = JSON.parse(userRaw);
    } catch (_error) {
        user = null;
    }
    if (!user) return null;

    let permissions = null;
    const permissionsRaw = sessionStorage.getItem(MOBILE_STORAGE_KEYS.permissions) || localStorage.getItem(MOBILE_STORAGE_KEYS.permissions);
    if (permissionsRaw) {
        try {
            permissions = JSON.parse(permissionsRaw);
        } catch (_error) {
            permissions = null;
        }
    }

    return {
        user,
        token,
        sessionId: sessionStorage.getItem(MOBILE_STORAGE_KEYS.sessionId) || localStorage.getItem(MOBILE_STORAGE_KEYS.sessionId) || '',
        permissions
    };
}

function clearSession() {
    Object.values(MOBILE_STORAGE_KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    });
}

function formatMetric(value, fallback = '0') {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
    return String(value);
}

function moduleCardMarkup(module, index) {
    return `
        <button type="button" class="module-card" data-module-path="${escapeHtml(module.path)}" style="animation-delay:${Math.min(index * 45, 300)}ms">
            <span class="module-icon" style="background: linear-gradient(135deg, ${module.accent}26, rgba(255,255,255,0.04)); color: ${module.accent};">
                <i data-lucide="${escapeHtml(module.icon)}"></i>
            </span>
            <strong>${escapeHtml(module.label)}</strong>
            <p>${escapeHtml(module.description)}</p>
            <span class="access-pill">${escapeHtml(module.accessLabel)} access</span>
        </button>
    `;
}

function statMarkup(icon, value, title, description) {
    return `
        <article class="stat-card">
            <div class="stat-icon"><i data-lucide="${escapeHtml(icon)}"></i></div>
            <strong>${escapeHtml(value)}</strong>
            <span>${escapeHtml(title)}${description ? ` - ${escapeHtml(description)}` : ''}</span>
        </article>
    `;
}

function renderDashboard(session) {
    activeSession = session;
    activeBucket = getRoleBucket(session.user);
    const user = session.user || {};
    const modules = buildAllowedModules(activeBucket, user);
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileMeta = document.getElementById('profileMeta');
    const profileRoleChip = document.getElementById('profileRoleChip');
    const profileCampusChip = document.getElementById('profileCampusChip');
    const profileGroupChip = document.getElementById('profileGroupChip');

    welcomeTitle.textContent = `Welcome, ${user.fullName || user.username || 'User'}`;
    welcomeSubtitle.textContent = `You are signed in as ${getRoleLabel(user)}. Use the cards below to open the exact ERP pages your role can access.`;
    profileAvatar.textContent = getInitials(user.fullName || user.username || user.role);
    profileName.textContent = user.fullName || user.username || 'User';
    profileMeta.textContent = user.campusName ? `${getRoleLabel(user)} - ${user.campusName}` : getRoleLabel(user);
    profileRoleChip.textContent = getRoleLabel(user);
    profileCampusChip.textContent = user.campusName || 'All Campuses';
    profileGroupChip.textContent = user.groupKey || user.role || 'User';

    const stats = [];
    stats.push(statMarkup('sparkles', getRoleLabel(user), 'Current role', user.username || ''));
    stats.push(statMarkup('shield-check', activeBucket.toUpperCase(), 'Access bucket', 'Mobile dashboard'));
    stats.push(statMarkup('layers-3', String(modules.length), 'Open modules', 'Tap to launch'));
    stats.push(statMarkup('wifi', 'Live', 'Backend', 'Heartbeat active'));

    document.getElementById('statsGrid').innerHTML = stats.join('');
    document.getElementById('moduleGrid').innerHTML = modules.map((module, index) => moduleCardMarkup(module, index)).join('');
    document.getElementById('moduleSectionTitle').textContent = activeBucket === 'admin'
        ? 'Management Modules'
        : activeBucket === 'finance'
            ? 'Finance Modules'
            : activeBucket === 'teacher'
                ? 'Teacher Modules'
                : activeBucket === 'student'
                    ? 'Student Modules'
                    : 'Quick Modules';

    document.querySelectorAll('[data-module-path]').forEach((button) => {
        button.addEventListener('click', () => {
            const path = String(button.dataset.modulePath || '').trim();
            if (path) window.location.href = path;
        });
    });

    const search = document.getElementById('moduleSearch');
    if (search) {
        search.oninput = () => {
            const term = search.value.trim().toLowerCase();
            document.querySelectorAll('[data-module-path]').forEach((card) => {
                card.style.display = card.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        };
    }

    document.getElementById('bottomFinanceButton').onclick = () => {
        const financePriority = ['finance', 'revenue', 'fees', 'fee_challan', 'teacher_salaries'];
        const financeTarget = financePriority.map((key) => modules.find((module) => module.key === key)).find(Boolean);
        if (financeTarget) {
            window.location.href = financeTarget.path;
            return;
        }
        window.location.href = activeBucket === 'student' ? '/student_portal.html' : '/dashboard.html';
    };

    setActiveView(true);
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
}

async function callHeartbeat() {
    if (!activeSession?.token) return;
    try {
        const response = await fetch(`${API_BASE_URL}/session/heartbeat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${activeSession.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: 'mobile.html', bucket: activeBucket })
        });
        if (response.status === 401) {
            await logout({ silent: true });
        }
    } catch (_error) {
        // Keep the session warm even if the network blips briefly.
    }
}

function startHeartbeat() {
    if (heartbeatTimer) window.clearInterval(heartbeatTimer);
    callHeartbeat();
    heartbeatTimer = window.setInterval(callHeartbeat, HEARTBEAT_MS);
}

async function fetchProfile(session) {
    const userRole = String(session.user?.role || '').toLowerCase();
    const endpoint = userRole === 'student'
        ? '/student/me'
        : userRole === 'teacher'
            ? '/teacher/me'
            : null;

    if (!endpoint) return session;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${session.token}`
            }
        });
        if (!response.ok) return session;
        const profile = await response.json();
        const mergedUser = { ...session.user, ...profile };
        return { ...session, user: mergedUser };
    } catch (_error) {
        return session;
    }
}

async function login(event) {
    event.preventDefault();

    const status = document.getElementById('loginStatus');
    const button = document.getElementById('loginButton');
    const remember = document.getElementById('mobileRemember').checked;
    const username = document.getElementById('mobileUsername').value.trim();
    const password = document.getElementById('mobilePassword').value;

    if (!username || !password) {
        status.textContent = 'Please enter your username and password.';
        return;
    }

    button.disabled = true;
    button.querySelector('span').textContent = 'Signing in...';
    status.textContent = 'Connecting to live server...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Login failed.');
        }

        const session = {
            token: data.token,
            sessionId: data.sessionId || '',
            user: data.user || {},
            permissions: data.permissions || null
        };

        saveSession(session, remember);
        const enrichedSession = await fetchProfile(session);
        saveSession(enrichedSession, remember);
        document.getElementById('connectionStatus').innerHTML = '<i data-lucide="wifi"></i> Connected';
        document.getElementById('loginStatus').textContent = 'Login successful. Loading your dashboard...';
        document.getElementById('mobileLoginForm').reset();
        renderDashboard(enrichedSession);
        startHeartbeat();
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    } catch (error) {
        status.textContent = error?.message || 'Unable to sign in.';
    } finally {
        button.disabled = false;
        button.querySelector('span').textContent = 'Sign In';
    }
}

async function logout(options = {}) {
    const silent = Boolean(options.silent);
    if (!silent && !window.confirm('Logout from the mobile app?')) return;

    const token = activeSession?.token || sessionStorage.getItem(MOBILE_STORAGE_KEYS.token) || localStorage.getItem(MOBILE_STORAGE_KEYS.token);
    if (token) {
        try {
            await fetch(`${API_BASE_URL}/session/end`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (_error) {
            // Ignore network errors during logout.
        }
    }

    if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    activeSession = null;
    clearSession();
    document.getElementById('connectionStatus').innerHTML = '<i data-lucide="wifi"></i> Checking';
    setActiveView(false);
    document.getElementById('loginStatus').textContent = silent ? 'Session expired. Please sign in again.' : 'Signed out successfully.';
    if (!silent) {
        document.getElementById('mobileLoginForm').reset();
    }
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
}

function bootstrap() {
    document.getElementById('mobileLoginForm').addEventListener('submit', login);
    document.getElementById('logoutButton').addEventListener('click', () => logout());
    document.getElementById('bottomLogoutButton').addEventListener('click', () => logout());
    document.getElementById('openFullErpButton').addEventListener('click', () => {
        if (activeBucket === 'student') {
            window.location.href = '/student_portal.html';
            return;
        }
        if (activeBucket === 'teacher') {
            window.location.href = '/teacher_portal.html';
            return;
        }
        if (activeBucket === 'finance') {
            window.location.href = '/finance.html';
            return;
        }
        window.location.href = '/dashboard.html';
    });

    document.getElementById('togglePasswordButton').addEventListener('click', () => {
        const input = document.getElementById('mobilePassword');
        const icon = document.querySelector('#togglePasswordButton i');
        const hidden = input.type === 'password';
        input.type = hidden ? 'text' : 'password';
        icon.setAttribute('data-lucide', hidden ? 'eye-off' : 'eye');
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    });

    document.querySelectorAll('[data-nav-target]').forEach((item) => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-nav-target');
            const element = document.getElementById(targetId);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.bottom-nav .nav-item').forEach((nav) => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const session = loadStoredSession();
    if (session) {
        fetchProfile(session).then((enrichedSession) => {
            saveSession(enrichedSession, Boolean(localStorage.getItem(MOBILE_STORAGE_KEYS.token)));
            document.getElementById('connectionStatus').innerHTML = '<i data-lucide="wifi"></i> Connected';
            renderDashboard(enrichedSession);
            startHeartbeat();
        });
    } else {
        setActiveView(false);
        document.getElementById('connectionStatus').innerHTML = '<i data-lucide="wifi"></i> Ready';
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/mobile-sw.js').catch(() => {});
    }

    fetch(`${API_BASE_URL}/health`)
        .then((response) => response.json())
        .then((data) => {
            if (data?.success) {
                document.getElementById('connectionStatus').innerHTML = '<i data-lucide="wifi"></i> Online';
                if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
            }
        })
        .catch(() => {});
}

window.addEventListener('DOMContentLoaded', bootstrap);

