const { createHandler, sendJson } = require('../_lib/http');
const { getDb } = require('../_lib/db');
const { authenticateToken } = require('../_lib/services');
const { getSmtpConfig, sendSmtpEmail } = require('../_lib/mailer');
const { buildFeeReminderEmail } = require('../_lib/emailTemplate');

module.exports = createHandler({
    POST: async ({ req, res, db }) => {
        authenticateToken(req);
        const { Student, FeePayment, FeeDueBalance } = db.models;
        const students = await Student.findAll();
        const payments = FeePayment ? await FeePayment.findAll() : [];
        const dueRows = FeeDueBalance ? await FeeDueBalance.findAll() : [];
        const dueMap = new Map(dueRows.map((row) => [String(row.studentId || ''), Number(row.balance || 0) || 0]));
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = months[new Date().getMonth()];
        const currentLower = currentMonth.toLowerCase();
        const currentShort = currentMonth.slice(0, 3).toLowerCase();
        const paidByStudent = new Map();

        payments.forEach((payment) => {
            if (!['paid', 'partial'].includes(String(payment.status || '').toLowerCase())) return;
            if (String(payment.paymentSource || '').toLowerCase().includes('fine')) return;
            const feeMonth = String(payment.feeMonth || '').toLowerCase();
            if (!feeMonth.includes(currentLower) && !feeMonth.includes(currentShort)) return;
            const studentId = String(payment.studentId || '');
            paidByStudent.set(studentId, (paidByStudent.get(studentId) || 0) + (Number(payment.amount || 0) || 0));
        });

        const schoolName = getSmtpConfig().fromName || 'American Lyceum International School Sharaqpur Campus';
        const result = { pendingFees: { sent: 0, failed: 0, skipped: 0, errors: [] }, birthdays: { sent: 0, failed: 0 }, specialNotices: { sent: 0, failed: 0 } };

        for (const row of students) {
            const student = row.toJSON ? row.toJSON() : row;
            const email = String(student.email || '').trim();
            const status = String(student.enrollmentStatus || student.feesStatus || '').toLowerCase();
            if (!email || status.includes('terminated')) {
                result.pendingFees.skipped += 1;
                continue;
            }

            const monthlyFee = Number(String(student.monthlyFee || student.fee || 0).replace(/,/g, '')) || 0;
            const storedDue = dueMap.has(String(student.id || ''))
                ? dueMap.get(String(student.id || ''))
                : Number(String(student.remainingAmount || 0).replace(/,/g, ''));
            const remainingCharges = Math.max(Number(storedDue || 0), 0);
            const paidAmount = paidByStudent.get(String(student.id || '')) || 0;
            const monthlyPending = Math.max(monthlyFee - paidAmount, 0);
            const totalPending = monthlyPending + remainingCharges;
            if (!(totalPending > 0)) {
                result.pendingFees.skipped += 1;
                continue;
            }

            try {
                const emailBody = buildFeeReminderEmail({
                    schoolName,
                    student,
                    currentMonth,
                    monthlyPending,
                    remainingCharges,
                    totalPending
                });
                await sendSmtpEmail({
                    to: email,
                    subject: `${schoolName} Fee Reminder - ${currentMonth}`,
                    text: emailBody.text,
                    html: emailBody.html
                });
                result.pendingFees.sent += 1;
            } catch (error) {
                result.pendingFees.failed += 1;
                result.pendingFees.errors.push({
                    studentId: student.id || '',
                    email,
                    message: error.message || 'Email failed.'
                });
            }
        }

        sendJson(res, 200, {
            success: true,
            message: result.pendingFees.failed ? 'Some emails failed.' : 'Emails executed successfully.',
            totalSent: result.pendingFees.sent,
            totalFailed: result.pendingFees.failed,
            result
        });
    }
}, { getDb });
