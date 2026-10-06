# Email sign-in and Super Admin setup

One-time steps in the Firebase console (https://console.firebase.google.com, project **ski-trip-platform**).

## 1. Turn on email sign-in (before the new form goes live)

Authentication → Get started (if shown) → **Sign-in method** → **Email/Password** → Enable → Save.

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
