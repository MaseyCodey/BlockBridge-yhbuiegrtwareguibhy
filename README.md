# BlockBridge Verification

A responsive, two-step Minecraft community verification page. Visitors enter their Minecraft email, Minecraft username, and Discord username, then re-enter all three on a blank confirmation screen. Matching details are sent to a private Discord webhook by a Vercel serverless function.

## Important security note

Do **not** paste a Discord webhook into `app.js`, `index.html`, or any file committed to GitHub. A webhook in browser code is public and can be abused. This project keeps it in Vercel's encrypted environment settings.

This form performs a **manual community identity check**. It does not authenticate with Microsoft, Mojang, Minecraft, or Discord, and must never ask for passwords or one-time codes.

## Deploy from GitHub to Vercel

1. Create a new GitHub repository and upload the contents of this folder—not the parent folder.
2. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
3. Import the repository.
4. Leave **Framework Preset** set to **Other** and keep the root directory as `./`.
5. Do not add a build command or output directory.
6. Open **Environment Variables** before deploying.
7. Add `DISCORD_WEBHOOK_URL` and paste the webhook URL from your private moderator channel as its value.
8. Enable the variable for Production, Preview, and Development if you want test deployments to send messages too.
9. Click **Deploy**.
10. Submit a test request and confirm that its embed appears in Discord.

Every push to the connected GitHub branch will trigger a new Vercel deployment. The browser sends the form to `/api/verify`, which runs `api/verify.js` on Vercel without exposing the webhook.

## Local preview

After installing the Vercel CLI, create a local-only `.env.local` file:

```text
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-secret-value
```

Then run:

```text
vercel dev
```

Never commit `.env.local`; it is already covered by `.gitignore`.

## Customize

- Replace `BlockBridge` in `index.html` with your community name.
- Update the copy and footer disclaimer as needed.
- Replace `assets/hero.png` with your own original 16:9 image while keeping the same filename.
- Change the Discord embed wording and color in `api/verify.js`.

## Abuse prevention

The form includes server-side validation, a honeypot, and a minimum completion time. For a heavily shared public link, also enable Vercel Firewall rate limiting or add a CAPTCHA before launch.
