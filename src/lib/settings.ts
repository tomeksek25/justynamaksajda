import settings from '../data/settings.json';

export { settings };

export const socialLinks = [
  { href: settings.instagram, label: 'Instagram' },
  { href: settings.facebook, label: 'Facebook' },
].filter((s) => s.href);
