// Runs after Netlify has accepted a contact form submission and emails it to Justyna through Resend, with
// thumbnails of the selected works. Netlify only invokes it for submissions that passed its spam filter, and
// rejects outside requests to event functions (they're signed by Netlify), so it can't be used to send mail.
//
// Netlify environment variables:
//   RESEND_API_KEY  API key from resend.com (sending access is enough)
//   ENQUIRY_TO      where enquiries go, e.g. justyna.joanna.maksajda@gmail.com
//   ENQUIRY_FROM    sender on the domain verified in Resend, e.g. "Strona – Justyna Maksajda <formularz@justynamaksajda.com>"
// If any is missing, nothing is sent; Netlify's own form notification still works.
import { buildEnquiryEmail } from '../../src/server/enquiry-email.mjs';

const ok = (text) => new Response(text, { status: 200 });

export default async (req) => {
  let payload;
  try {
    ({ payload } = await req.json());
  } catch (error) {
    console.error('[enquiry] the request had no valid JSON body.', error);
    return ok('Bad request');
  }
  if (payload?.form_name !== 'enquiry') return ok('Ignored');

  // The same address the site was built with (see astro.config.mjs), so links in the works index match it.
  const siteUrl = process.env.SITE_URL || process.env.URL;
  const { RESEND_API_KEY, ENQUIRY_TO, ENQUIRY_FROM } = process.env;
  const missing = Object.entries({ RESEND_API_KEY, ENQUIRY_TO, ENQUIRY_FROM, 'URL or SITE_URL': siteUrl })
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    console.error(`[enquiry] not configured (${missing.join(', ')}); no email sent.`);
    return ok('Not configured');
  }

  // Titles, sizes and thumbnails as published with the current version of the site. Without them, the email
  // falls back to the plain list of works the form sent.
  let works;
  try {
    const res = await fetch(new URL('/enquiry-works.json', siteUrl), { signal: AbortSignal.timeout(3000) });
    if (res.ok) works = await res.json();
    else console.error(`[enquiry] works index returned ${res.status}; sending without thumbnails.`);
  } catch (error) {
    console.error('[enquiry] could not load the works index; sending without thumbnails.', error);
  }

  const email = buildEnquiryEmail({ data: payload.data ?? {}, works, siteUrl });
  const send = (replyTo) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: ENQUIRY_FROM,
        to: [ENQUIRY_TO],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });

  try {
    let res = await send(email.replyTo);
    // A reply-to address Resend won't accept shouldn't lose the enquiry: the visitor's address is in the text.
    if (res.status === 422 && email.replyTo) {
      console.error(`[enquiry] Resend rejected the message (${await res.text()}); retrying without reply-to.`);
      res = await send(undefined);
    }
    if (!res.ok) {
      console.error(`[enquiry] Resend returned ${res.status}: ${await res.text()}`);
      return ok('Email failed');
    }
  } catch (error) {
    console.error('[enquiry] could not reach Resend.', error);
    return ok('Email failed');
  }
  return ok('Sent');
};
