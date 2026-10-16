// Cloudflare Pages Function for the contact form (POST /api/enquiry): checks the visitor isn't a bot, then
// emails the enquiry to Justyna through Resend, with thumbnails of the selected works.
//
// Cloudflare Pages settings (Settings → Variables and Secrets, production):
//   RESEND_API_KEY        secret – API key from resend.com (sending access for the domain)
//   ENQUIRY_TO            where enquiries go, e.g. justyna.joanna.maksajda@gmail.com
//   ENQUIRY_FROM          sender on the domain verified in Resend, e.g. "Strona – Justyna Maksajda <formularz@justynamaksajda.com>"
//   TURNSTILE_SECRET_KEY  secret – Cloudflare Turnstile secret key (the site key is PUBLIC_TURNSTILE_SITE_KEY at build time)
//   SITE_URL              the site's address, the same as at build time, e.g. https://www.justynamaksajda.com
// Without TURNSTILE_SECRET_KEY nothing is sent, so a missing setting can't open the form to bots. For local
// testing only, ALLOW_NO_TURNSTILE=true skips the check.
//
// The page's script sends the form with fetch and gets JSON back. A plain post (no JavaScript) gets a redirect
// to the thank-you page or back to the form, but in practice needs JavaScript for the Turnstile check.
import { buildEnquiryEmail, isEmailAddress } from '../../src/server/enquiry-email.mjs';

const LIMITS = { name: 200, email: 254, phone: 50, message: 10000, works: 5000, 'work-ids': 2000, subject: 300 };

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  let form;
  try {
    form = await request.formData();
  } catch {
    return reply({ request, wantsJson, error: 'invalid' });
  }
  const field = (name) => String(form.get(name) ?? '');
  const tooLong = Object.entries(LIMITS).some(([name, max]) => field(name).length > max);
  const language = form.get('language') === 'en' ? 'en' : 'pl';
  const done = (error) => reply({ request, wantsJson, language, error });

  // A filled-in hidden field means a bot: pretend it worked.
  if (field('bot-field')) return done();

  // Checked before the bot check, so a visitor fixing a field doesn't have to solve it again.
  const data = Object.fromEntries(
    ['name', 'email', 'phone', 'message', 'works', 'work-ids', 'subject'].map((name) => [name, field(name).trim()]),
  );
  data.language = language;
  if (tooLong || !data.name || !data.message || !isEmailAddress(data.email)) return done('invalid');

  const required = ['RESEND_API_KEY', 'ENQUIRY_TO', 'ENQUIRY_FROM'];
  if (env.ALLOW_NO_TURNSTILE !== 'true') required.push('TURNSTILE_SECRET_KEY');
  const missing = required.filter((name) => !env[name]);
  if (missing.length) {
    console.error(`[enquiry] not configured (${missing.join(', ')}); no email sent.`);
    return done('send');
  }
  const siteUrl = env.SITE_URL || new URL(request.url).origin;

  // The bot check and the works index (titles, sizes and thumbnails as published with this version of the
  // site) are fetched together. Without the index, the email falls back to the plain list the form sent.
  const [human, works] = await Promise.all([
    env.TURNSTILE_SECRET_KEY
      ? verifyTurnstile(env.TURNSTILE_SECRET_KEY, form.get('cf-turnstile-response'), request)
      : true,
    loadWorks(env, request),
  ]);
  if (!human) return done('bot');

  const email = buildEnquiryEmail({ data, works, siteUrl });
  // Resend drops a repeat with the same key, e.g. when the visitor resends after a timed-out (but delivered) try.
  const key = await digest(`${data.email}\n${data.message}\n${data['work-ids']}`);
  const send = (replyTo) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': replyTo ? key : `${key}-plain`,
      },
      body: JSON.stringify({
        from: env.ENQUIRY_FROM,
        to: [env.ENQUIRY_TO],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

  try {
    let res = await send(email.replyTo);
    // A reply-to address the email service won't accept shouldn't lose the enquiry: it's in the text too.
    if (res.status === 422 && email.replyTo) {
      console.error(`[enquiry] Resend rejected the message (${await res.text()}); retrying without reply-to.`);
      res = await send(undefined);
    }
    if (!res.ok) {
      console.error(`[enquiry] Resend returned ${res.status}: ${await res.text()}`);
      return done('send');
    }
  } catch (error) {
    console.error('[enquiry] could not reach Resend.', error);
    return done('send');
  }
  return done();
}

async function digest(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadWorks(env, request) {
  try {
    const res = await env.ASSETS.fetch(new URL('/enquiry-works.json', request.url));
    if (res.ok) return await res.json();
    console.error(`[enquiry] works index returned ${res.status}; sending without thumbnails.`);
  } catch (error) {
    console.error('[enquiry] could not load the works index; sending without thumbnails.', error);
  }
  return undefined;
}

/** Cloudflare Turnstile: the token the widget put into the form must be valid for this visitor. */
async function verifyTurnstile(secret, token, request) {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', String(token));
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const result = await res.json();
    if (!result.success) console.error('[enquiry] Turnstile check failed:', JSON.stringify(result['error-codes']));
    return !!result.success;
  } catch (error) {
    console.error('[enquiry] could not reach Turnstile.', error);
    return false;
  }
}

/** JSON for the page's script, or a redirect for a plain form post. */
function reply({ request, wantsJson, language = 'pl', error }) {
  const prefix = language === 'en' ? '/en' : '';
  const path = error ? `${prefix}/contact/?error=${error}#form` : `${prefix}/thank-you/`;
  if (wantsJson) {
    return Response.json(error ? { ok: false, error } : { ok: true, redirect: path }, { status: error ? 400 : 200 });
  }
  return Response.redirect(new URL(path, request.url).href, 303);
}
