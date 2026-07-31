/** @type {import('@capacitor/cli').CapacitorConfig} */
module.exports = {
  appId: 'com.americanlyceum.mobile',
  appName: 'American Lyceum',
  webDir: 'frontend',
  ios: {
    scrollEnabled: true,
    allowsLinkPreview: false,
    preferredContentMode: 'mobile'
  },
  server: {
    url: 'https://alis.eduzeeno.com/login',
    allowNavigation: [
      'alis.eduzeeno.com',
      '*.eduzeeno.com'
    ]
  }
};
