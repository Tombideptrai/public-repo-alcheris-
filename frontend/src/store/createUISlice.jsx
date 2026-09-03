export const createUISlice = (set) => ({
  isInspectorOpen: false,
  isSidebarOpen: true,
  isPreviewMode: false,
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  openInspector: () => set({ isInspectorOpen: true }),
  closeInspector: () => set({ isInspectorOpen: false }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  togglePreview: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
});
