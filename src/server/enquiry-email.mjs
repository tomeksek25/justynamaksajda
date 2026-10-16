// Builds the enquiry email Justyna receives when someone sends the contact form: the selected works with
// thumbnails, then the message. Independent of the hosting platform, so the sending code can change
// (Netlify function + Resend today) without touching this.

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Only links back to the site itself are put into the email. */
const isSiteUrl = (url, siteUrl) => {
  try {
    return new URL(url).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
};

/**
 * @param {object} args
 * @param {Record<string, string>} args.data Submitted form fields.
 * @param {Record<string, {title: string, year: string, dimensions: string, url: string, thumb: string}>} [args.works]
 *   Works index published by the site (/enquiry-works.json), keyed by work id. If it couldn't be loaded, the
 *   plain list of works the form sent is used instead.
 * @param {string} args.siteUrl The site's address, e.g. https://justynamaksajda.com.
 * @returns {{subject: string, html: string, text: string, replyTo?: string}}
 */
export function buildEnquiryEmail({ data, works, siteUrl }) {
  const name = (data.name ?? '').trim();
  const email = (data.email ?? '').trim();
  const phone = (data.phone ?? '').trim();
  const message = (data.message ?? '').trim();
  const language = data.language === 'en' ? 'angielska' : 'polska';
  // Replying goes straight to the visitor; only a plain address is used, which the email service accepts.
  const replyTo = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(email) ? email : undefined;

  // Ids come from the visitor's browser, so only known works are shown, each once, at most 30.
  const requested = [...new Set(String(data['work-ids'] ?? '').split(',').map((id) => id.trim()).filter(Boolean))];
  const known = (id) => !!works && Object.prototype.hasOwnProperty.call(works, id);
  const selected = requested.filter(known).slice(0, 30).map((id) => works[id]);
  // The form also sends the works as text ("Title (year, size) – link"); it's shown when some couldn't be matched.
  const worksText = String(data.works ?? '').trim();
  const showWorksText = !!worksText && (!works || requested.some((id) => !known(id)));
  const multiline = (text) => escape(text).replace(/\r?\n/g, '<br>');

  const subject = (
    selected.length
      ? `Zapytanie: ${selected.map((w) => w.title).join(', ')}`
      : worksText
        ? String(data.subject ?? '') || 'Zapytanie ze strony'
        : 'Wiadomość ze strony'
  )
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 200);

  const workRows = selected
    .map((w) => {
      const url = isSiteUrl(w.url, siteUrl) ? w.url : siteUrl;
      const thumb = isSiteUrl(w.thumb, siteUrl) ? w.thumb : '';
      const meta = [w.year, w.dimensions].filter(Boolean).join(' · ');
      return `<tr>
  <td style="padding:8px 16px 8px 0;vertical-align:top;width:120px">${
    thumb
      ? `<a href="${escape(url)}"><img src="${escape(thumb)}" width="120" alt="${escape(w.title)}" style="display:block;width:120px;height:auto;border:0"></a>`
      : ''
  }</td>
  <td style="padding:8px 0;vertical-align:top;font-size:15px;line-height:1.4">
    <a href="${escape(url)}" style="color:#2b2b2b;font-style:italic">${escape(w.title)}</a>
    ${meta ? `<div style="color:#7a7a7a;font-size:14px">${escape(meta)}</div>` : ''}
  </td>
</tr>`;
    })
    .join('\n');

  const contactRows = [
    ['Imię i nazwisko', escape(name)],
    ['E-mail', email ? `<a href="mailto:${escape(email)}">${escape(email)}</a>` : ''],
    ['Telefon', phone ? `<a href="tel:${escape(phone.replace(/\s+/g, ''))}">${escape(phone)}</a>` : ''],
    ['Wersja strony', language],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:2px 16px 2px 0;color:#7a7a7a;white-space:nowrap">${label}</td><td style="padding:2px 0">${value}</td></tr>`,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#ffffff;color:#2b2b2b;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px">
<p style="margin:0 0 16px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#7a7a7a">Nowa wiadomość ze strony</p>
${
  selected.length
    ? `<h2 style="margin:0 0 8px;font-size:16px;font-weight:normal">Prace w zapytaniu (${selected.length})</h2>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">
${workRows}
</table>`
    : ''
}
${
  showWorksText
    ? `<h2 style="margin:0 0 8px;font-size:16px;font-weight:normal">Prace podane w formularzu</h2>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5">${multiline(worksText)}</p>`
    : ''
}
<h2 style="margin:0 0 8px;font-size:16px;font-weight:normal">Wiadomość</h2>
<div style="margin:0 0 24px;padding:16px;background:#f6f6f5;font-size:15px;line-height:1.5">${multiline(message)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px">
${contactRows}
</table>
<p style="margin:24px 0 0;font-size:13px;color:#7a7a7a">${replyTo ? 'Odpowiedź na tego maila trafi bezpośrednio do nadawcy.' : 'Adres nadawcy wygląda na niepoprawny – sprawdź go przed odpowiedzią.'}</p>
</div>
</body>
</html>`;

  const text = [
    'Nowa wiadomość ze strony',
    '',
    ...(selected.length
      ? ['Prace w zapytaniu:', ...selected.map((w) => `- ${w.title}${w.year ? `, ${w.year}` : ''}${w.dimensions ? `, ${w.dimensions}` : ''} – ${w.url}`), '']
      : []),
    ...(showWorksText ? ['Prace podane w formularzu:', worksText, ''] : []),
    'Wiadomość:',
    message,
    '',
    `Imię i nazwisko: ${name}`,
    `E-mail: ${email}`,
    ...(phone ? [`Telefon: ${phone}`] : []),
    `Wersja strony: ${language}`,
  ].join('\n');

  return { subject, html, text, replyTo };
}
