# Interview prep

Questions about this project I should be able to answer, and the answer in my own words.

## How did you let people try the app without an account, and what stops a guest from writing to your database?

**Short answer:** guest mode is local only. A guest never has a Supabase session, so there is no token to send, and the database only lets signed-in users read or write.

**How it works:**
- The app was already offline-first: every screen reads a Zustand store saved to localStorage, and a background sync uploads changes when there's a signed-in user. So a guest is "the app, minus sync."
- "Try as guest" switches the store to its own localStorage key and fills it with sample data (a small arsenal, two patterns, two league nights) so the screens aren't empty. A guest on a phone that was signed in before never sees, or mixes with, that account's nights.
- Scoring, a full 3-game night, and the bingo and 3-6-9 side pots all work, because they only touch the store. Stats has a "your games this visit" section that leaves the sample nights out.
- Anything that would save to an account (balls, patterns, profile, seasons) is blocked in two places: the screen checks first and shows a "Create a free account to save this." prompt, and the store action itself does nothing as a backstop.
- The sync layer skips the store entirely while a guest holds it, so nothing is even queued to upload later.

**What actually stops the writes:** the UI blocking is for the experience. The real guard is the database. Every table grants select, insert and update only to the `authenticated` role, with row-level security tying each row to `auth.uid()`. A guest has no session, so any request runs as `anon`, which has no grants at all.

**The trade-off I chose against:** Supabase anonymous sign-ins. They give a guest a real user id, and upgrading to a full account keeps it, which makes "keep my games" free. But anonymous users get the same `authenticated` role, so my policies would have let them write unless I added a "not anonymous" check to every table. One missed table is an open write, and every visitor leaves a user row behind.

**Keeping guest games on sign-up:** the guest's own nights (never the sample ones, which all have `sample-` ids) wait on the device until the new account's first sign-in, since email confirmation comes first. Then they're added to the store as ordinary edits and sync uploads them.

**How I tested it:** tests run the real sync loop against a fake server and check that a guest scoring a night writes nothing, that declining to keep uploads nothing, and that keeping uploads exactly the guest's night. A control test shows a signed-in user's night does upload, so "nothing uploaded" means something. Removing the guard makes the test fail.

**TODO:** do the manual check on the live link (play as a guest, then confirm the Supabase table editor shows no new rows) and note the date here.
