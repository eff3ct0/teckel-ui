"use client";

import { useEffect } from "react";
import {
  Sparkles,
  PanelLeft,
  MousePointerClick,
  Code,
  Play,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { TUTORIAL_STEPS, useTutorialStore } from "@/stores/tutorial-store";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to Teckel",
    body: (
      <>
        <p>
          Teckel is a visual editor for building data pipelines. Design your
          flow on the canvas and we generate the YAML — or edit the YAML and we
          update the canvas.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          This quick tour takes under a minute. You can reopen it anytime from
          the help button in the top bar.
        </p>
      </>
    ),
  },
  {
    icon: PanelLeft,
    title: "Drag nodes from the palette",
    body: (
      <>
        <p>
          The left sidebar is the <strong>node palette</strong>. Drag an input,
          transformation, or output onto the canvas to start building.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Tip: toggle the palette with the panel icon in the top-left.
        </p>
      </>
    ),
  },
  {
    icon: MousePointerClick,
    title: "Connect and configure",
    body: (
      <>
        <p>
          Drag from a node's handle to another to wire them up. Click any node
          to open the <strong>config panel</strong> on the right and edit its
          properties.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Errors surface inline on the node and in the top-bar counter.
        </p>
      </>
    ),
  },
  {
    icon: Code,
    title: "YAML is the source of truth",
    body: (
      <>
        <p>
          Open the <strong>YAML panel</strong> (button in the top bar or{" "}
          <kbd className="rounded bg-[var(--secondary)] px-1">Ctrl+E</kbd>) to
          see the generated spec. You can edit it directly and the canvas stays
          in sync.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Import/export YAML files anytime to share pipelines.
        </p>
      </>
    ),
  },
  {
    icon: Play,
    title: "Connect a server and Run",
    body: (
      <>
        <p>
          Open the connection settings (the wifi icon in the top bar) and point
          Teckel at a worker URL. Once the dot turns green, you can{" "}
          <strong>Validate</strong>, <strong>Explain</strong>, and{" "}
          <strong>Run</strong> your pipeline.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Try the Templates gallery for ready-made example pipelines.
        </p>
      </>
    ),
  },
];

export function TutorialOverlay() {
  const isOpen = useTutorialStore((s) => s.isOpen);
  const step = useTutorialStore((s) => s.step);
  const close = useTutorialStore((s) => s.close);
  const next = useTutorialStore((s) => s.next);
  const prev = useTutorialStore((s) => s.prev);
  const goTo = useTutorialStore((s) => s.goTo);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, next, prev]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === TUTORIAL_STEPS - 1;
  const isFirst = step === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="relative mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Close (Esc)"
          aria-label="Close tutorial"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
              Step {step + 1} of {TUTORIAL_STEPS}
            </div>
            <h2
              id="tutorial-title"
              className="text-base font-semibold text-[var(--foreground)]"
            >
              {current.title}
            </h2>
          </div>
        </div>

        <div className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
          {current.body}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-[var(--primary)]"
                    : "w-1.5 bg-[var(--border)] hover:bg-[var(--muted-foreground)]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                className="flex h-8 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
              >
                Get started
              </button>
            ) : (
              <>
                <button
                  onClick={close}
                  className="flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                >
                  Skip
                </button>
                <button
                  onClick={next}
                  className="flex h-8 items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
