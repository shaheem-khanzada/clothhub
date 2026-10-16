import { TrueSheet } from '@lodev09/react-native-true-sheet';

/** The sign-in sheet's name (components/auth/SignInSheet, mounted once in the root layout). */
export const SIGN_IN_SHEET = 'sign-in';

/**
 * Opens sign-in over whatever is on screen. A TrueSheet presents from the
 * topmost screen, so this works over the reel's always-open product sheet too.
 */
export function presentSignIn() {
  void TrueSheet.present(SIGN_IN_SHEET);
}
