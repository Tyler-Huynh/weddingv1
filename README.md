# Hannah & Eli's Wedding RSVP — Deployment Guide

This site has two parts:
- **`public/`** — the actual website (HTML/CSS/JS + your photo)
- **`api/rsvp.js`** — a small serverless function that saves RSVPs to Postgres

Both deploy together on Vercel. Total setup time: about 10 minutes.

---

## 1. Create a Vercel account & project

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub login is easiest).
2. Push this folder to a GitHub repo (or use the Vercel CLI — see step 5).
3. In the Vercel dashboard, click **Add New → Project** and import that repo.
4. Leave the default settings and click **Deploy**. It will deploy successfully
   even before the database is connected — the RSVP form just won't save
   anything yet.

## 2. Add a Postgres database

1. In your new Vercel project, go to the **Storage** tab.
2. Click **Create Database → Postgres** (this is powered by Neon under the
   hood, and Vercel wires up the connection for you automatically).
3. Once created, click **Connect** to link it to this project. Vercel will
   automatically add a `POSTGRES_URL` environment variable — you don't need
   to copy/paste any connection strings yourself.

## 3. Create the `rsvps` table

You need to run `schema.sql` once against your new database:

1. In the Storage tab, open your Postgres database and find the **Query**
   tab (or "Data" browser — Vercel's UI has changed names before, look for
   anywhere you can run raw SQL).
2. Paste the full contents of `schema.sql` and run it.
3. You should now have an empty `rsvps` table, ready to receive responses.

## 4. Set your admin key

This lets you view submitted RSVPs privately, without a login system.

1. In your Vercel project, go to **Settings → Environment Variables**.
2. Add a new variable:
   - **Name:** `ADMIN_KEY`
   - **Value:** any long random string you make up (e.g. `mountain-thread-9284`)
3. Redeploy the project (Settings changes require a redeploy — Vercel will
   prompt you, or just push any small change to trigger one).

## 5. Redeploy

If you added the database *after* your first deploy, trigger a new deploy so
the app picks up the `POSTGRES_URL` variable:

- Easiest: go to the **Deployments** tab and click **Redeploy** on the latest one.
- Or, using the Vercel CLI from this folder:
  ```
  npm install -g vercel
  vercel --prod
  ```

---

## Using it

- **The RSVP form** on your live site now saves directly to Postgres — no
  further setup needed on the frontend. It collects: guest name, email,
  attending yes/no, party size (with required names for any extra guests
  once party size is more than 1), allergies/dietary restrictions, whether
  the guest is 21 or older, whether anyone in their party is 12 or under,
  and a free-text note to the couple.
- **The countdown timer and "Add to calendar" button** in the hero work
  immediately with no setup — they're pure frontend, no database involved.
  Both are set to **May 15, 2027**.
- **A little leaf-confetti burst** plays when someone successfully submits
  their RSVP. Purely decorative, no setup needed.
- **A live "who's coming" tally** above the RSVP form (e.g. "41 friends are
  already celebrating with us") pulls from `/api/stats`, a public endpoint
  that only returns aggregate counts — no names or personal info exposed.
- **A "tap for a random fact about us" flip card** in the story section —
  pure frontend, edit the `funFacts` array directly in `index.html` to swap
  in your own.
- **To see your full guest list**, visit:
  ```
  https://your-site.vercel.app/api/rsvp?key=YOUR_ADMIN_KEY
  ```
  (use the same value you set for `ADMIN_KEY`). This returns raw JSON —
  every RSVP, most recent first, including allergies and any extra guest
  names. Bookmark it, or ask me to build a nicer admin page later if you'd
  like a proper table view instead of JSON.

- **Your own domain:** once deployed, add your domain under
  **Settings → Domains** in Vercel — no code changes needed.

---

## Is this really ready to deploy immediately?

Yes, with one caveat: **steps 2–4 above (connecting Postgres, running the
schema, setting `ADMIN_KEY`) are one-time manual steps you do in the Vercel
dashboard** — no tool can do those for you, since they require your Vercel
account. Everything else — code, config, dependencies — is already done:

- `vercel.json` and `package.json` are set up for zero-config deployment.
- The `api/` functions use Vercel's native Postgres client, so there's no
  connection string to hand-wire — Vercel injects it once you connect the
  database.
- `.gitignore` and `.env.example` are included so you don't accidentally
  commit secrets if you go on to customize this further.

If you skip steps 2–4, the **site itself still deploys and looks correct**
— the RSVP form will just show an error toast until the database is
connected, since there's nowhere yet for it to save data.

---

## If something doesn't save

- Double check the database is **Connected** to this specific project
  (Storage tab → your database → Projects).
- Make sure you ran `schema.sql` — if the `rsvps` table doesn't exist,
  submissions will fail with a 500 error.
- Check **Deployments → [latest] → Functions → api/rsvp** in the Vercel
  dashboard for error logs if RSVPs still aren't showing up.
