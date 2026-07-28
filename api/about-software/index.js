const { createHandler, sendJson } = require('../_lib/http');
const { readStore, upsertRecord } = require('../_lib/mobileStore');

const defaultAboutSoftware = {
    id: 'ABOUT-SOFTWARE',
    appName: 'American Lyceum',
    schoolName: 'American Lyceum',
    website: 'https://YOUR-DOMAIN.com/',
    supportEmail: '',
    supportPhone: '03174944258',
    schoolAddress: 'Main tehsil Road near post office Sharaqpur Sharif district sheikhupura',
    description: 'Student and teacher portal APIs for American Lyceum.',
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
