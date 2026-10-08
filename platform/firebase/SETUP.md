# Email sign-in and Super Admin setup

One-time steps in the Firebase console (https://console.firebase.google.com, project **ski-trip-platform**).

## 1. Turn on sign-in (before the new form goes live)

1. Authentication → Get started (if shown) → **Sign-in method** → **Email/Password** → Enable → Save.
2. Same page → **Add new provider** → **Google** → Enable → choose your email as the support email → Save.
3. Authentication → **Settings** → **Authorised domains** → make sure `thefint.github.io` is listed (Add domain if not).

## 2. Make yourself Super Admin

1. Open the admin form, choose **Create an account**, and sign up with your email.
2. Click the link in the verification email, then press **Continue**.
3. In the Firebase console: Authentication → **Users** → copy your **User UID**.
4. Firestore Database → **Start collection** → Collection ID `admins` → Document ID: paste your UID → add a field `email` (string) with your email → Save.
5. Reload the admin form. An **Open Super Admin** button appears.

## 3. Lock the database

- Firestore Database → **Rules** → replace everything with the contents of `firestore.rules` → **Publish**.
- Storage → **Rules** → replace everything with the contents of `storage.rules` → **Publish**.

## 4. Clean up

Super Admin → **Remove old passwords**.

## 5. Existing teachers

Each teacher creates an account on the admin form, then types their existing school ID under **Already have a site from before?** and presses **Request access**. Approve them in Super Admin → **Access Requests**.

## Locked-out teachers

They press **Forgot password?** on the sign-in screen, or you press **Send password reset** next to their school in Super Admin.

## Adding another Super Admin

Repeat step 2.3–2.4 with their User UID.

## Access request emails (optional)

Get an email whenever a teacher presses **Request access**.

1. Go to https://script.google.com while signed in to the Google account that should receive the emails → **New project**.
2. Delete what's in the editor and paste in the contents of `notify-requests.gs`. Press **Save** (💾).
3. In the function menu at the top choose **testEmail** → **Run** → **Review permissions** → choose your account → **Advanced** → **Go to project (unsafe)** → **Allow**. You should get a test email.
4. **Deploy** → **New deployment** → gear icon ⚙ → **Web app**. Set **Execute as: Me** and **Who has access: Anyone** → **Deploy**.
5. Copy the **Web app URL** (ends in `/exec`) and put it in `REQUEST_NOTIFY_URL` near the top of the script in `admin.html`.
