"use client";

import { usePipelineStore } from "@/stores/pipeline-store";
import { TagInput } from "@/components/shared/tag-input";
import { KeyValueEditor } from "@/components/shared/key-value-editor";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 ${mono ? "font-mono" : ""}`}
    />
  );
}

export function PipelineMetadataForm() {
  const name = usePipelineStore((s) => s.name);
  const setName = usePipelineStore((s) => s.setName);
  const metadata = usePipelineStore((s) => s.metadata);
  const setMetadata = usePipelineStore((s) => s.setMetadata);

  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <TextInput
          value={name}
          onChange={setName}
          placeholder="Pipeline name"
        />
      </div>
      <div>
        <Label>Namespace</Label>
        <TextInput
          value={metadata.namespace}
          onChange={(v) => setMetadata({ namespace: v })}
          placeholder="e.g. analytics, etl"
          mono
        />
      </div>
      <div>
        <Label>Version</Label>
        <TextInput
          value={metadata.version}
          onChange={(v) => setMetadata({ version: v })}
          placeholder="e.g. 1.0.0"
          mono
        />
      </div>
      <div>
        <Label>Description</Label>
        <textarea
          value={metadata.description}
          onChange={(e) => setMetadata({ description: e.target.value })}
          placeholder="Pipeline description..."
          rows={3}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
        />
      </div>
      <div>
        <Label>Owner</Label>
        <TextInput
          value={metadata.owner}
          onChange={(v) => setMetadata({ owner: v })}
          placeholder="team or person"
        />
      </div>
      <div>
        <Label>Schedule</Label>
        <TextInput
          value={metadata.schedule}
          onChange={(v) => setMetadata({ schedule: v })}
          placeholder="e.g. 0 6 * * * (cron expression)"
          mono
        />
      </div>
      <div>
        <Label>Tags</Label>
        <TagInput
          value={metadata.tags}
          onChange={(v) => setMetadata({ tags: v })}
          placeholder="Add tag..."
        />
      </div>
      <div>
        <Label>Meta</Label>
        <KeyValueEditor
          value={metadata.meta}
          onChange={(v) => setMetadata({ meta: v })}
          keyPlaceholder="key"
          valuePlaceholder="value"
        />
      </div>
    </div>
  );
}
