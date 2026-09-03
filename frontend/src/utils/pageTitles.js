const AUTO_PAGE_TITLES = new Set(['Introduction', 'New Lesson', 'Untitled page']);

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ');

const collectLexicalText = (node) => {
  if (!node || typeof node !== 'object') return '';
  const ownText = typeof node.text === 'string' ? node.text : '';
  const childText = Array.isArray(node.children)
    ? node.children.map(collectLexicalText).join(' ')
    : '';
  return `${ownText} ${childText}`.trim();
};

export const extractPageTitleText = (content = {}) => {
  if (typeof content === 'string') return content.trim();
  const lexicalText = collectLexicalText(content.json?.root);
  if (lexicalText) return lexicalText.replace(/\s+/g, ' ').trim();
  if (typeof content.text === 'string' && content.text.trim()) return content.text.trim();
  if (typeof content.html === 'string') return stripHtml(content.html).replace(/\s+/g, ' ').trim();
  return '';
};

export const isSlashCommandDraft = (value = '') => value.trimStart().startsWith('/');

export const derivePageTitle = (content = {}) => {
  const candidate = extractPageTitleText(content);
  if (!candidate || isSlashCommandDraft(candidate)) return '';
  return candidate.slice(0, 60);
};

export const shouldAutoUpdatePageTitle = (title = '') => (
  AUTO_PAGE_TITLES.has(title) || isSlashCommandDraft(title) || !title.trim()
);

export const normalizeAutoPageTitle = (page) => {
  if (!page || !shouldAutoUpdatePageTitle(page.title || '')) return page;
  const derived = derivePageTitle(page.leftPanel?.[0]?.content);
  if (derived) return { ...page, title: derived };
  if (isSlashCommandDraft(page.title || '') || !page.title?.trim()) {
    return { ...page, title: 'Untitled page' };
  }
  return page;
};
