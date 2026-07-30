const { createHandler, sendJson } = require('../_lib/http');
const { getDb } = require('../_lib/db');

function buildBalances(rows) {
    return rows.reduce((acc, row) => {
        const studentId = String(row.studentId || '').trim();
        if (!studentId) return acc;
        const balance = Number(row.balance || 0);
        acc[studentId] = Number.isFinite(balance) ? balance : 0;
        return acc;
    }, {});
}

module.exports = createHandler({
    GET: async ({ res, db }) => {
        const { FeeDueBalance } = db.models;
        if (!FeeDueBalance) {
            sendJson(res, 200, { success: true, balances: {} });
            return;
        }

        const rows = await FeeDueBalance.findAll();
        sendJson(res, 200, { success: true, balances: buildBalances(rows) });
    },
    POST: async ({ res, db, body }) => {
        const { FeeDueBalance } = db.models;
        if (!FeeDueBalance) {
            sendJson(res, 503, { success: false, message: 'Due balance model is not available.' });
            return;
        }

        const studentId = String(body?.studentId || body?.id || '').trim();
        const rawBalance = String(body?.balance ?? body?.remainingAmount ?? 0).replace(/,/g, '');
        const parsedBalance = Number(rawBalance);
        const balance = Number.isFinite(parsedBalance) ? Math.max(parsedBalance, 0) : 0;
        if (!studentId) {
            sendJson(res, 400, { success: false, message: 'studentId is required.' });
            return;
        }

        await FeeDueBalance.upsert({
            studentId,
            balance,
            updatedAtLabel: new Date().toLocaleString('en-GB')
        });

        const rows = await FeeDueBalance.findAll();
        sendJson(res, 200, {
            success: true,
            dueBalance: { studentId, balance },
            balances: buildBalances(rows)
        });
    }
}, { getDb });
