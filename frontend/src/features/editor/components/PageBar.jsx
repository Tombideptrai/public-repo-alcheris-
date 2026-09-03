import React from 'react';
import { useLessonStore } from '../../../store/useLessonStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PageBar = () => {
  const { lesson, goToPage } = useLessonStore();
  const { pages, currentPageIndex } = lesson;

  const totalPages = pages.length;
  const currentDisplay = currentPageIndex + 1;

  const btnClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-[var(--color-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[var(--color-muted-foreground)] active:scale-95";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => goToPage(currentPageIndex - 1)}
        disabled={currentPageIndex === 0}
        className={btnClass}
      >
        <ChevronLeft size={14} />
      </button>

      <span className="text-xs font-medium text-[var(--color-muted-foreground)] tabular-nums min-w-[3rem] text-center select-none">
        {currentDisplay} / {totalPages}
      </span>

      <button
        type="button"
        aria-label="Next page"
        onClick={() => goToPage(currentPageIndex + 1)}
        disabled={currentPageIndex === totalPages - 1}
        className={btnClass}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
