/**
 * Picks a representative emoji icon for a criteria based on keywords in its
 * name (Arabic or English). Criteria are admin-defined, so this matches on
 * common inspection categories and falls back to a neutral clipboard icon.
 */
const RULES: Array<{ icon: string; terms: string[] }> = [
  { icon: '❄️', terms: ['تكييف', 'تبريد', 'ac', 'air', 'cooling', 'hvac'] },
  { icon: '⚡', terms: ['كهرب', 'electric', 'power', 'wiring'] },
  { icon: '🚪', terms: ['باب', 'ابواب', 'أبواب', 'door'] },
  { icon: '🛗', terms: ['مصعد', 'elevator', 'lift'] },
  { icon: '🖌️', terms: ['دهان', 'صباغ', 'اصباغ', 'أصباغ', 'طلاء', 'paint'] },
  { icon: '🪟', terms: ['نافذة', 'نوافذ', 'شباك', 'window', 'المنيوم', 'ألمنيوم', 'الومنيوم', 'aluminum', 'aluminium'] },
  { icon: '🏗️', terms: ['structure', 'هيكل', 'انشائ', 'إنشائ', 'خرسان', 'concrete'] },
  { icon: '🛋️', terms: ['ديكور', 'decor', 'interior', 'تشطيب'] },
  { icon: '🟫', terms: ['ارضي', 'أرضي', 'ارضيات', 'أرضيات', 'بلاط', 'floor', 'tile', 'tiling', 'رخام', 'marble'] },
  { icon: '🚿', terms: ['سباك', 'صحي', 'ماء', 'مياه', 'plumb', 'water', 'صرف', 'drain', 'sanitary'] },
  { icon: '🔥', terms: ['حريق', 'اطفاء', 'إطفاء', 'fire', 'safety', 'سلامة'] },
  { icon: '📐', terms: ['ارتداد', 'ارتدادات', 'setback'] },
  { icon: '🏠', terms: ['واجهة', 'خارج', 'exterior', 'facade', 'سطح', 'roof'] },
  { icon: '🚽', terms: ['حمام', 'دورة مياه', 'bathroom', 'toilet', 'مطبخ', 'kitchen'] }
];

export function criteriaIcon(name: string): string {
  const n = (name || '').toLowerCase();
  for (const rule of RULES) {
    if (rule.terms.some((term) => n.includes(term.toLowerCase()))) return rule.icon;
  }
  return '📋';
}
