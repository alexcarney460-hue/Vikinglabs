export function formatAffiliateCode(raw: string) {
  return raw.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function buildAffiliateCodeSeed(name: string, email: string) {
  const baseName = name.split(' ')[0] || '';
  const baseEmail = email.split('@')[0] || '';
  return formatAffiliateCode(`${baseName}${baseEmail}`) || 'VIKING';
}
