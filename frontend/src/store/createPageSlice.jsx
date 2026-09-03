import { arrayMove } from '@dnd-kit/sortable';
import { getBlockDefaults } from './blockDefaults';

const id = (kind) => `${kind}-${crypto.randomUUID()}`;
const freshPage = (index = 0, group = 'Module 1') => ({ id: id('page'), title: `Page ${index + 1}`, group, layout: 'split', leftPanel: [{ id: id('block'), type: 'h1', content: getBlockDefaults('h1') }], rightPanel: [] });
const initialLesson = () => ({ title: 'My lesson', currentPageIndex: 0, pages: [freshPage()] });

export const createPageSlice = (set) => ({
  lesson: initialLesson(),
  resetLesson: () => set({ lesson: initialLesson(), deletedPageIds: [], deletedBlockIds: [], selectedBlockId: null }),
  setLesson: (lesson) => set((state) => ({ lesson: { ...lesson, pages: lesson.pages || [], currentPageIndex: lesson.currentPageIndex ?? state.lesson.currentPageIndex ?? 0 } })),
  addPage: (group) => set((state) => {
    const page = freshPage(state.lesson.pages.length, group || state.lesson.pages[state.lesson.currentPageIndex]?.group || 'Module 1');
    return { lesson: { ...state.lesson, pages: [...state.lesson.pages, page], currentPageIndex: state.lesson.pages.length }, selectedBlockId: page.leftPanel[0].id };
  }),
  updatePage: (index, patch) => set((state) => ({ lesson: { ...state.lesson, pages: state.lesson.pages.map((page, i) => i === index ? { ...page, ...patch } : page) } })),
  deletePage: (index) => set((state) => {
    if (state.lesson.pages.length <= 1) return state;
    const removed = state.lesson.pages[index]; const pages = state.lesson.pages.filter((_, i) => i !== index);
    return { lesson: { ...state.lesson, pages, currentPageIndex: Math.min(state.lesson.currentPageIndex, pages.length - 1) }, deletedPageIds: [...(state.deletedPageIds || []), removed.id] };
  }),
  goToPage: (index) => set((state) => index >= 0 && index < state.lesson.pages.length ? { lesson: { ...state.lesson, currentPageIndex: index }, selectedBlockId: null } : state),
  reorderPage: (activeId, overId, targetGroup) => set((state) => {
    const from = state.lesson.pages.findIndex((page) => page.id === activeId); const to = state.lesson.pages.findIndex((page) => page.id === overId);
    if (from < 0 || to < 0) return state;
    const pages = arrayMove(state.lesson.pages, from, to).map((page) => page.id === activeId && targetGroup ? { ...page, group: targetGroup } : page);
    return { lesson: { ...state.lesson, pages, currentPageIndex: pages.findIndex((page) => page.id === activeId) } };
  }),
  setPageLayout: (layout) => set((state) => ({ lesson: { ...state.lesson, pages: state.lesson.pages.map((page, i) => i === state.lesson.currentPageIndex ? { ...page, layout } : page) } })),
  setRightPanelMode: () => {},
});
