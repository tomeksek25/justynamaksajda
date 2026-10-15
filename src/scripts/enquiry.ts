// The "enquiry list": works a visitor wants to ask about, kept across pages in localStorage.
// If storage is unavailable (private mode, blocked cookies) it still works within the current page.
const KEY = 'jm-enquiry';
let memory: string[] = [];
// Set once a write fails, so reads stop returning stale data from storage.
let storageBroken = false;

// Slugs of works that can be enquired about (set by the layout); removed, hidden or sold works drop out.
const enquirable = new Set<string>(JSON.parse(document.body.dataset.enquirable ?? '[]'));
const isEnquirable = (slug: string) => enquirable.has(slug);

function readStored(): string[] {
  if (storageBroken) return memory;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    // fall through to the in-memory copy
  }
  return memory;
}

export const getList = () => readStored().filter(isEnquirable);

function setList(list: string[]) {
  memory = [...new Set(list)];
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    storageBroken = true;
  }
  render();
}

export const addWork = (slug: string) => {
  if (isEnquirable(slug)) setList([...getList(), slug]);
};
export const removeWork = (slug: string) => setList(getList().filter((s) => s !== slug));
export const clearList = () => setList([]);

// The contact form records when it was submitted; the thank-you page clears the list only right after that.
const SENT_KEY = 'jm-enquiry-sent';

export function markSent() {
  try {
    sessionStorage.setItem(SENT_KEY, String(Date.now()));
  } catch {
    // the list just won't be cleared automatically
  }
}

export function clearIfJustSent() {
  try {
    const sentAt = Number(sessionStorage.getItem(SENT_KEY));
    sessionStorage.removeItem(SENT_KEY);
    if (sentAt && Date.now() - sentAt < 2 * 60 * 1000) clearList();
  } catch {
    // storage unavailable
  }
}

function render() {
  const list = getList();
  document.querySelectorAll<HTMLElement>('[data-enquiry-count]').forEach((el) => {
    el.textContent = String(list.length);
  });
  document.querySelectorAll<HTMLElement>('[data-enquiry-nav]').forEach((el) => {
    el.hidden = list.length === 0;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-enquiry-toggle]').forEach((btn) => {
    const on = list.includes(btn.dataset.slug ?? '');
    btn.setAttribute('aria-pressed', String(on));
    const label = btn.querySelector('[data-label]');
    if (label) label.textContent = (on ? btn.dataset.labelOn : btn.dataset.labelOff) ?? '';
  });
  document.dispatchEvent(new CustomEvent('enquiry:change', { detail: list }));
}

document.addEventListener('click', (event) => {
  const btn = (event.target as Element).closest<HTMLButtonElement>('[data-enquiry-toggle]');
  if (!btn?.dataset.slug) return;
  const slug = btn.dataset.slug;
  if (getList().includes(slug)) removeWork(slug);
  else addWork(slug);
});

// Keep several open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === KEY || event.key === null) render();
});

// Pages restored with the Back button keep their old DOM; bring them up to date.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) render();
});

render();
