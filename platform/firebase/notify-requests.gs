/**
 * Ski Trip Admin helper script.
 *
 * 1. Emails the administrator when a teacher requests access.
 * 2. Lets a teacher who has forgotten their login type their school ID on
 *    "Forgot password?": the script looks up the email linked to that school
 *    and asks Firebase to send it a password reset link. The email address is
 *    never shown to the person asking.
 *
 * Setup: see "Access request emails" and "School ID password reset" in SETUP.md.
 * Emails go to the Google account that deploys this script, which must be an
 * owner/editor of the Firebase project for the school ID lookup to work.
 */
const SUPER_ADMIN_URL = 'https://thefint.github.io/-asm-ski-trip-2027/platform/superadmin.html';
const FIREBASE_PROJECT = 'ski-trip-platform';
const FIREBASE_API_KEY = 'AIzaSyBcZ0Ks2v5mCQbePdoYWHnZElVfsi_Znc8'; // public web key, same as in admin.html
const MAX_EMAILS_PER_HOUR = 20;
const MAX_RESETS_PER_HOUR = 30;

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.action === 'reset') { resetBySchoolId_(String(d.schoolId || '')); return done_(); }
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

/** Send a password reset to whoever manages this school, without revealing their email. */
function resetBySchoolId_(rawId) {
  const schoolId = rawId.trim().toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9.@_-]{1,60}$/.test(schoolId)) return;

  const cache = CacheService.getScriptCache();
  const key = 'reset_' + Utilities.base64EncodeWebSafe(schoolId).slice(0, 200);
  if (cache.get(key)) return;                                 // one reset per school every 10 minutes
  const count = Number(cache.get('resetCount') || 0);
  if (count >= MAX_RESETS_PER_HOUR) return;
  cache.put(key, '1', 600);
  cache.put('resetCount', String(count + 1), 3600);

  const email = ownerEmail_(schoolId);
  if (email) {
    UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ requestType: 'PASSWORD_RESET', email: email })
    });
  } else if (schoolExists_(schoolId)) {
    // An old site that no teacher has claimed yet: let the administrator know
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: 'Ski Trip: someone is trying to get back into ' + schoolId,
      htmlBody: '<p>Someone used <strong>Forgot password?</strong> with the school ID <strong>' + schoolId + '</strong>, '
        + 'but no teacher account is linked to that site yet, so no reset could be sent.</p>'
        + '<p>Ask the teacher to sign in (Google or Create an account) and press <strong>Request access</strong>, then approve them in '
        + '<a href="' + SUPER_ADMIN_URL + '">Super Admin</a>.</p>'
    });
  }
}

function firestoreGet_(path) {
  const res = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents/' + path, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  return res.getResponseCode() === 200 ? JSON.parse(res.getContentText()) : null;
}
function ownerEmail_(schoolId) {
  const d = firestoreGet_('schoolOwners/' + encodeURIComponent(schoolId));
  return (d && d.fields && d.fields.email && d.fields.email.stringValue) || '';
}
function schoolExists_(schoolId) {
  return !!firestoreGet_('schools/' + encodeURIComponent(schoolId));
}

function done_() {
  return ContentService.createTextOutput('ok');
}

/** Run this once from the editor to check emails arrive (it also asks for permission). */
function testEmail() {
  send_('test.teacher@example.com', 'test-school', 'Test School');
}

/** Run this from the editor to check the school ID lookup works. Change 'asm' to a school you manage. */
function testLookup() {
  const id = 'asm';
  Logger.log('School "' + id + '" exists: ' + schoolExists_(id) + ' | linked teacher email found: ' + (ownerEmail_(id) ? 'yes' : 'no'));
}
