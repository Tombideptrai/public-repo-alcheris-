import React from 'react';
import { filterVisiblePlayerBlocks } from './playerBlockVisibility';

export const RuntimeEmptyPanel = ({ children }) => (
  <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-10 text-center text-sm text-[var(--color-muted-foreground)]">
    {children}
  </div>
);

export const RuntimeCanvasPanel = ({
  blocks = [],
  renderBlock,
  emptyMessage,
  isResizing = false,
  scrollRef,
  surface = 'background',
}) => {
  const visibleBlocks = filterVisiblePlayerBlocks(blocks);
  const isFloating = surface === 'floating';
  const surfaceClass = isFloating ? 'surface-floating' : 'app-canvas-surface';
  // The floating panel is narrow — the wide left-canvas gutters would cramp it,
  // so blocks there get tighter, consistent horizontal padding.
  const paddingClass = isFloating
    ? 'py-6 px-5 md:px-6 pb-24'
    : 'py-8 px-6 md:px-16 lg:px-20 pb-32';

  return (
    <div className={`flex h-full flex-col overflow-hidden relative ${surfaceClass}`}>
      {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize" />}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto custom-scrollbar relative ${paddingClass}`}
      >
        <div className="max-w-3xl mx-auto min-h-[50vh]">
          {visibleBlocks.length > 0 ? (
            visibleBlocks.map((block, index) => renderBlock(block, index))
          ) : (
            <RuntimeEmptyPanel>{emptyMessage}</RuntimeEmptyPanel>
          )}
        </div>
      </div>
    </div>
  );
};
