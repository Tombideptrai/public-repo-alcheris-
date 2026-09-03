const isInlineCodingBlock = (block) => (
  !block?.content?.curriculum && (
  block?.type === 'snippet' ||
  block?.content?.presentation === 'inline' ||
  block?.content?.mode === 'snippet' ||
  block?.content?.code !== undefined
  )
);

const hasImmersiveCodingBlock = (page) => (
  (page?.rightPanel || []).some((block) => block?.type === 'coding' && !isInlineCodingBlock(block))
);

const getImmersiveCodingMode = (page) => {
  const codingBlock = (page?.rightPanel || []).find((block) => block?.type === 'coding' && !isInlineCodingBlock(block));
  if (!codingBlock) return null;
  return codingBlock.content?.workspacePreset === 'code-practice' ? 'code-practice' : 'ui-project';
};

export const normalizeRightPanelMode = (mode) => {
  if (mode === 'leetcode') return 'ui-project';
  if (mode === 'ielts') return 'exam';
  return mode || 'standard';
};

export const getEffectiveRightPanelMode = (page) => {
  if (!page) return 'standard';
  const mode = normalizeRightPanelMode(page.rightPanelMode);
  if (mode === 'ui-project') return getImmersiveCodingMode(page) || 'ui-project';
  if (mode && mode !== 'standard') return mode;
  if (hasImmersiveCodingBlock(page)) return getImmersiveCodingMode(page) || 'ui-project';
  return mode || 'standard';
};
