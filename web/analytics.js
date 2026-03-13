// ── Squigglebug Analytics ─────────────────────────────────────────────────────
// Analytics are DISABLED by default. To enable, replace 'G-XXXXXXXXXX' below
// with your own Google Analytics 4 Measurement ID.
//
// Your Measurement ID is not a secret — it appears in any page that loads GA.
// If you fork this project, use your own ID so you get your own data.
//
// COPPA NOTE: This app targets children. The config below disables all ad
// personalisation and Google signals, satisfying COPPA/GDPR-K requirements
// for analytics-only (non-advertising) data collection. You should also enable
// "Disable Personalized Advertising" in your GA4 property settings and mark
// the property as child-directed in the Google Analytics admin UI.
//
// Events tracked by app.js:
//   session_end        → session_duration_sec, draw_time_sec, stroke_count, clear_count
//   canvas_cleared     → method: 'shake' | 'double_tap' | 'double_click'
//   pwa_install_prompt → fired when browser offers Add to Home Screen
//   pwa_installed      → fired after user installs the PWA
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var GA_ID = 'G-XXXXXXXXXX'; // ← replace with your Measurement ID to enable
  if (GA_ID === 'G-XXXXXXXXXX') return; // no-op until configured

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, {
    // COPPA / child-directed: disable all advertising and personalisation features
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    restricted_data_processing: true
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.addEventListener('beforeinstallprompt', function () { gtag('event', 'pwa_install_prompt'); });
  window.addEventListener('appinstalled',        function () { gtag('event', 'pwa_installed'); });
}());

