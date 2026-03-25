"use client";

export function PipelineEditor() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--background)]">
      {/* TopBar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-[var(--foreground)]">Teckel UI</h1>
          <span className="text-xs text-[var(--muted-foreground)]">Pipeline Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">No pipeline loaded</span>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette - Left sidebar */}
        <aside className="w-[200px] shrink-0 border-r border-[var(--border)] bg-[var(--card)]">
          <div className="p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Nodes
            </p>
          </div>
        </aside>

        {/* Canvas - Center */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 bg-[var(--background)]">
            <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
              <p className="text-sm">Canvas — React Flow will render here</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
