import { create } from 'zustand';

let toastId = 0;

const DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = ++toastId;
    const duration = DURATIONS[type] || 3000;

    set((state) => {
      const toasts = [...state.toasts, { id, type, message, isExiting: false }];
      if (toasts.length > 5) toasts.shift();
      return { toasts };
    });

    setTimeout(() => get().removeToast(id), duration);
    return id;
  },

  removeToast: (id) => {
    const toasts = get().toasts;
    if (!toasts.find((t) => t.id === id)) return;

    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, isExiting: true } : t
      ),
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 150);
  },
}));

export const toast = {
  success: (message) => useToastStore.getState().addToast('success', message),
  error: (message) => useToastStore.getState().addToast('error', message),
  warning: (message) => useToastStore.getState().addToast('warning', message),
  info: (message) => useToastStore.getState().addToast('info', message),
};
