import type { ConfigureParams } from '@react-native-google-signin/google-signin';

/**
 * Google sign-in's clients, in Google Auth Platform (project cloth-hub).
 * Client IDs aren't secret: they identify the app, and every build ships them.
 *
 * - `webClientId`: the Web client. Google addresses the identity token to it,
 *   on iOS and Android alike, and the API (GOOGLE_CLIENT_ID) checks it.
 * - `iosClientId`: the iOS client for com.clothhub.digital. Its reversed form
 *   is the URL scheme in app.json, which brings the person back to the app.
 * - Android needs no ID here: Google recognises the app by its package and
 *   signing certificate (Android clients for com.clothhubapp).
 */
export const GOOGLE_SIGN_IN: ConfigureParams = {
  webClientId: '437625319454-or3op22dpi7rnt361khq3tpji4j6q281.apps.googleusercontent.com',
  iosClientId: '437625319454-jo4bgi3r1b47fc451m3ul2hvpkag1ep6.apps.googleusercontent.com',
};
