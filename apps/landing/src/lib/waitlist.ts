/**
 * Sends an email address to the waitlist.
 *
 * The endpoint comes from NEXT_PUBLIC_WAITLIST_URL (see .env.example) and
 * receives `{ "email": "…" }` as JSON. The API has no waitlist route yet, so
 * until it does the variable stays empty and this rejects — the form then tells
 * the visitor it couldn't add them.
 */
export async function joinWaitlist(email: string): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_WAITLIST_URL;

  if (!endpoint) {
    throw new Error('The waitlist is not connected yet: NEXT_PUBLIC_WAITLIST_URL is empty.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`The waitlist request failed with status ${response.status}.`);
  }
}
