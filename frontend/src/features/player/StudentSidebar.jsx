import React from 'react';
import { useLessonStore } from '../../store/useLessonStore';
import { ChevronDown, CheckCircle, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from '../../components/ui/IconButton';

export const StudentSidebarContent = ({ onNavigate, onClose, onPageRequest }) => {
  const { lesson, goToPage } = useLessonStore();
  const currentPageIndex = lesson.currentPageIndex || 0;
  const progress = lesson.pages.length ? Math.round(((currentPageIndex + 1) / lesson.pages.length) * 100) : 0;
  
  const chapters = lesson.pages.reduce((acc, page, index) => {
    const groupName = page.group || 'Ungrouped';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push({ ...page, originalIndex: index });
    return acc;
  }, {});

  return (
    <div className="flex h-full w-56 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3">
        <span className="text-xs font-medium tracking-wide text-[var(--color-muted-foreground)]">Pages</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-medium tabular-nums text-[var(--color-muted-foreground)]">{progress}%</span>
          {onClose && (
            <IconButton
              icon={PanelLeftClose}
              variant="nav"
              size="md"
              label="Collapse page map"
              onClick={onClose}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
        <div className="mb-2 px-2">
          <h2 className="line-clamp-2 text-sm font-medium text-[var(--color-foreground)]">{lesson.title}</h2>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
            <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {Object.entries(chapters).map(([groupName, pages]) => (
          <div key={groupName} className="mb-1">
            <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              <ChevronDown size={12} className="shrink-0" />
              <span className="truncate">{groupName}</span>
            </div>
            <div className="ml-3 border-l border-[var(--color-border)] pl-2">
              {pages.map((page) => {
                const isActive = currentPageIndex === page.originalIndex;
                const isComplete = page.originalIndex < currentPageIndex;
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      if (onPageRequest && !onPageRequest(page.originalIndex)) return;
                      goToPage(page.originalIndex);
                      onNavigate?.();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-all ${
                      isActive
                        ? 'bg-[var(--color-muted)] font-medium text-[var(--color-foreground)]'
                        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle size={14} className="shrink-0 text-[var(--color-success)] opacity-70" />
                    ) : (
                      <FileText size={14} className="shrink-0 opacity-60" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{page.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StudentSidebar = ({ isOpen, onToggle, onNavigate, onPageRequest, showToggle = true }) => {
  return (
    <div className="absolute inset-y-0 left-0 z-30 flex h-full shrink-0 md:relative md:inset-auto">
      <aside
        className={`h-full overflow-hidden bg-[var(--color-background)] transition-all duration-200 ease-out ${
          isOpen
            ? 'w-56 max-w-[82vw] border-r border-[var(--color-border)] shadow-xl shadow-black/10 md:shadow-none'
            : 'w-0 border-none shadow-none'
        }`}
      >
        <StudentSidebarContent onNavigate={onNavigate} onPageRequest={onPageRequest} />
      </aside>

      {showToggle && (
        <IconButton
          icon={isOpen ? PanelLeftClose : PanelLeftOpen}
          variant="nav"
          size="lg"
          label={isOpen ? 'Hide pages' : 'Show pages'}
          onClick={onToggle}
          className="absolute top-2 z-50 bg-[var(--color-background)]"
          style={{ right: isOpen ? '-22px' : '-44px' }}
        />
      )}
    </div>
  );
};
