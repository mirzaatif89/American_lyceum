function escapeEmailHtml(value = '') {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatEmailMoney(value = 0) {
    return `PKR ${Math.round(Number(value || 0)).toLocaleString('en-PK')}`;
}

function buildFeeReminderEmail({ schoolName, student, currentMonth, monthlyPending, remainingCharges, totalPending }) {
    const safeSchool = escapeEmailHtml(schoolName || 'American Lyceum School');
    const safeName = escapeEmailHtml(student?.fullName || student?.name || 'Student');
    const safeClass = escapeEmailHtml(student?.classGrade || '-');
    const safeRoll = escapeEmailHtml(student?.rollNo || '-');
    const safeMonth = escapeEmailHtml(currentMonth || '');

    const text = [
        `Dear ${student?.fullName || 'Student'},`,
        '',
        `This is a fee reminder from ${schoolName}.`,
        `Month: ${currentMonth}`,
        `Class: ${student?.classGrade || '-'}`,
        `Roll No: ${student?.rollNo || '-'}`,
        '',
        `Monthly pending: ${formatEmailMoney(monthlyPending)}`,
        `Remaining charges: ${formatEmailMoney(remainingCharges)}`,
        `Total payable: ${formatEmailMoney(totalPending)}`,
        '',
        'Please clear dues at your earliest.',
        '',
        schoolName
    ].join('\n');

    const html = `
        <div style="margin:0;padding:0;background:#f3f4f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f8;padding:28px 12px">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 14px 40px rgba(31,41,55,.12)">
                            <tr>
                                <td style="background:#43206f;padding:26px 30px;color:#ffffff">
                                    <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.9">Fee Reminder</div>
                                    <h1 style="margin:8px 0 0;font-size:26px;line-height:1.25;color:#ffffff">${safeSchool}</h1>
                                    <p style="margin:8px 0 0;font-size:14px;color:#eee7ff">Pending fee details for ${safeMonth}</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px 30px">
                                    <p style="margin:0 0 14px;font-size:15px">Dear <strong>${safeName}</strong>,</p>
                                    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563">This is a polite reminder that your fee dues are pending. Please review the summary below and clear the payable amount at your earliest.</p>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
                                        <tr>
                                            <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px">Student</td>
                                            <td style="padding:12px 14px;font-weight:700">${safeName}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px">Class / Roll No</td>
                                            <td style="padding:12px 14px;font-weight:700">${safeClass} / ${safeRoll}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px">Month</td>
                                            <td style="padding:12px 14px;font-weight:700">${safeMonth}</td>
                                        </tr>
                                    </table>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 22px">
                                        <tr>
                                            <td style="padding:14px;border:1px solid #e5e7eb;border-radius:12px 0 0 12px;background:#fbfdff">
                                                <div style="font-size:12px;color:#6b7280;font-weight:700">Monthly Pending</div>
                                                <div style="font-size:20px;font-weight:800;margin-top:6px">${formatEmailMoney(monthlyPending)}</div>
                                            </td>
                                            <td style="padding:14px;border:1px solid #e5e7eb;background:#fbfdff">
                                                <div style="font-size:12px;color:#6b7280;font-weight:700">Remaining Charges</div>
                                                <div style="font-size:20px;font-weight:800;margin-top:6px">${formatEmailMoney(remainingCharges)}</div>
                                            </td>
                                        </tr>
                                    </table>
                                    <div style="padding:18px 20px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa">
                                        <div style="font-size:13px;color:#9a3412;font-weight:800;text-transform:uppercase">Total Payable</div>
                                        <div style="font-size:30px;font-weight:900;color:#7c2d12;margin-top:6px">${formatEmailMoney(totalPending)}</div>
                                    </div>
                                    <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#4b5563">If you have already paid, please ignore this message or contact the school office for correction.</p>
                                    <p style="margin:18px 0 0;font-size:14px;font-weight:800;color:#111827">${safeSchool}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;

    return { text, html };
}

module.exports = {
    escapeEmailHtml,
    formatEmailMoney,
    buildFeeReminderEmail
};
