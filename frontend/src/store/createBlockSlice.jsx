import { arrayMove } from '@dnd-kit/sortable';
import { getBlockDefaults } from './blockDefaults';

const id = () => `block-${crypto.randomUUID()}`;
export const flushPendingBlockEdits = () => window.dispatchEvent(new CustomEvent('lesson:force-sync'));

const replaceBlocks = (state, blockId, transform) => ({
  ...state.lesson,
  pages: state.lesson.pages.map((page) => ({
    ...page,
    leftPanel: page.leftPanel.map((block) => block.id === blockId ? transform(block) : block),
    rightPanel: page.rightPanel.map((block) => block.id === blockId ? transform(block) : block),
  })),
});

export const createBlockSlice = (set) => ({
  selectedBlockId: null, selectedBlockIds: [], editingBlockId: null, deletedBlockIds: [],
  setSelectedBlock: (selectedBlockId) => set({ selectedBlockId, selectedBlockIds: [], editingBlockId: selectedBlockId, isInspectorOpen: true }),
  clearMultiSelection: () => set({ selectedBlockIds: [] }),
  toggleBlockSelection: (blockId) => set((state) => ({ selectedBlockId: blockId, selectedBlockIds: state.selectedBlockIds.includes(blockId) ? state.selectedBlockIds.filter((item) => item !== blockId) : [...state.selectedBlockIds, blockId] })),
  selectBlockRange: (blockId) => set({ selectedBlockId: blockId, selectedBlockIds: [blockId] }),
  addBlock: (panel, type, overrides = {}) => set((state) => {
    const block = { id: id(), type, content: { ...getBlockDefaults(type), ...overrides } }; const index = state.lesson.currentPageIndex;
    return { lesson: { ...state.lesson, pages: state.lesson.pages.map((page, pageIndex) => pageIndex === index ? { ...page, [panel]: [...page[panel], block] } : page) }, selectedBlockId: block.id, editingBlockId: block.id, isInspectorOpen: true };
  }),
  insertBlockAfter: (referenceId, type) => set((state) => {
    const block = { id: id(), type, content: getBlockDefaults(type) }; const index = state.lesson.currentPageIndex;
    const insert = (items) => { const itemIndex = items.findIndex((item) => item.id === referenceId); return itemIndex < 0 ? items : [...items.slice(0, itemIndex + 1), block, ...items.slice(itemIndex + 1)]; };
    return { lesson: { ...state.lesson, pages: state.lesson.pages.map((page, pageIndex) => pageIndex === index ? { ...page, leftPanel: insert(page.leftPanel), rightPanel: page.leftPanel.some((item) => item.id === referenceId) ? page.rightPanel : insert(page.rightPanel) } : page) }, selectedBlockId: block.id, editingBlockId: block.id };
  }),
  updateBlockContent: (blockId, content) => set((state) => ({ lesson: replaceBlocks(state, blockId, (block) => ({ ...block, content: { ...block.content, ...content } })) })),
  deleteBlock: (blockId) => set((state) => ({
    lesson: { ...state.lesson, pages: state.lesson.pages.map((page) => ({ ...page, leftPanel: page.leftPanel.filter((block) => block.id !== blockId), rightPanel: page.rightPanel.filter((block) => block.id !== blockId) })) },
    deletedBlockIds: [...state.deletedBlockIds, blockId], selectedBlockId: null, editingBlockId: null,
  })),
  reorderBlocks: (panel, activeId, overId) => set((state) => {
    const pageIndex = state.lesson.currentPageIndex; const page = state.lesson.pages[pageIndex]; const from = page[panel].findIndex((block) => block.id === activeId); const to = page[panel].findIndex((block) => block.id === overId);
    if (from < 0 || to < 0) return state; return { lesson: { ...state.lesson, pages: state.lesson.pages.map((item, index) => index === pageIndex ? { ...item, [panel]: arrayMove(item[panel], from, to) } : item) } };
  }),
});
