/**
 * Signing out of a forward-auth app.
 *
 * There is no session in this bundle to clear — Authentik's outpost holds it, in a cookie on this
 * domain, and Traefik consults the outpost before a request ever reaches the app. So logging out
 * means asking the outpost to drop it, which is a plain navigation to its sign-out endpoint. It
 * clears the cookie and hands the browser to Authentik's invalidation flow.
 *
 * Deliberately not an axios call: the response is a redirect chain across two origins, and an
 * XHR would follow it invisibly and leave the tab sitting on a page it is no longer allowed to
 * see.
 */
export const SIGN_OUT_URL = '/outpost.goauthentik.io/sign_out';

export function signOut(): void {
  globalThis.location.assign(SIGN_OUT_URL);
}
