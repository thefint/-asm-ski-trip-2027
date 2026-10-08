/**
 * Ski Trip Admin: email notification when a teacher requests access.
 *
 * Setup (once): see "Access request emails" in SETUP.md.
 * Emails go to the Google account that deploys this script.
 */
const SUPER_ADMIN_URL = 'https://thefint.github.io/-asm-ski-trip-2027/platform/superadmin.html';
const MAX_EMAILS_PER_HOUR = 20;

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const email = String(d.email || '').trim().slice(0, 200);
    const schoolId = String(d.schoolId || '').trim().slice(0, 60);
    const schoolName = String(d.schoolName || '').trim().slice(0, 120);
    // Ignore anything that doesn't look like a real request
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-z0-9.@_-]{1,60}$/.test(schoolId)) return done_();

    const cache = CacheService.getScriptCache();
    const key = 'r_' + Utilities.base64EncodeWebSafe(email + '|' + schoolId).slice(0, 200);
    if (cache.get(key)) return done_();                       // same request already emailed this hour
    const count = Number(cache.get('count') || 0);
    if (count >= MAX_EMAILS_PER_HOUR) return done_();         // protects your inbox from junk
    cache.put(key, '1', 3600);
    cache.put('count', String(count + 1), 3600);

    send_(email, schoolId, schoolName);
  } catch (err) {
    console.error(err);
  }
  return done_();
}

function send_(email, schoolId, schoolName) {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = schoolName ? schoolName + ' (' + schoolId + ')' : schoolId;
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Ski Trip: ' + email + ' requested access to ' + label,
    htmlBody:
      '<p><strong>' + esc(email) + '</strong> has asked for access to edit <strong>' + esc(label) + '</strong>.</p>' +
      '<p>Check the email matches the school, then approve or decline it in Super Admin:</p>' +
      '<p><a href="' + SUPER_ADMIN_URL + '" style="background:#0D2B55;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Open Super Admin</a></p>' +
      '<p style="color:#888;font-size:12px;">Sent automatically by the Ski Trip Admin form.</p>'
  });
}

function done_() {
  return ContentService.createTextOutput('ok');
}

/** Run this once from the editor to check emails arrive (it also asks for permission). */
function testEmail() {
  send_('test.teacher@example.com', 'test-school', 'Test School');
}
