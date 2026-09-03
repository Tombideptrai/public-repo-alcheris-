const TEXT_BLOCK_TYPES = new Set([
  'text',
  'paragraph',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'quote',
  'code',
]);

const stripHtml = (html = '') => String(html)
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

const collectLexicalText = (node) => {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(collectLexicalText).join(' ');
};

export const isEmptyPlayerTextBlock = (block) => {
  if (!TEXT_BLOCK_TYPES.has(block?.type)) return false;
  const content = block.content || {};

  if (block.type === 'code' && typeof content.code === 'string') {
    return content.code.trim().length === 0;
  }

  const lexicalText = collectLexicalText(content.json?.root).replace(/\s+/g, ' ').trim();
  if (lexicalText) return false;

  const htmlText = stripHtml(content.html);
  if (htmlText) return false;

  const markdownText = typeof content.markdown === 'string' ? content.markdown.trim() : '';
  if (markdownText) return false;

  const directText = typeof content.text === 'string' ? content.text.trim() : '';
  return !directText;
};

export const shouldRenderPlayerBlock = (block) => !isEmptyPlayerTextBlock(block);

export const filterVisiblePlayerBlocks = (blocks = []) => blocks.filter(shouldRenderPlayerBlock);

