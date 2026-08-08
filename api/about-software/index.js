const { createHandler, sendJson } = require('../_lib/http');
const { readStore, upsertRecord } = require('../_lib/mobileStore');

const defaultAboutSoftware = {
    id: 'ABOUT-SOFTWARE',
    appName: 'American Lyceum International School Sharaqpur Campus',
    schoolName: 'American Lyceum International School Sharaqpur Campus',
    website: process.env.SCHOOL_WEBSITE || 'https://americanlyceum.com/',
    supportEmail: process.env.SMTP_FROM_EMAIL || 'americanlyceumschoolsharaqpurc@gmail.com',
    supportPhone: '03174944258',
    schoolAddress: 'Main tehsil Road near post office Sharaqpur Sharif district sheikhupura',
    principalName: 'Mahmood ul Hassan',
    description: 'Student and teacher portal APIs for American Lyceum International School Sharaqpur Campus.',
    version: '1.0.0'
};

module.exports = createHandler({
    GET: async ({ res }) => {
        const records = readStore('about_software');
        sendJson(res, 200, { success: true, aboutSoftware: records[0] || defaultAboutSoftware });
    },
    POST: async ({ res, body }) => {
        const { record } = upsertRecord('about_software', {
            ...defaultAboutSoftware,
            ...(body || {}),
            id: body?.id || defaultAboutSoftware.id
        }, 'ABOUT');
        sendJson(res, 200, { success: true, aboutSoftware: record });
    }
});
