"use client";

import { useRef, useCallback, useState } from "react";
import type { TeckelNodeType } from "@/types/pipeline";
import { TagInput } from "@/components/shared/tag-input";
import { KeyValueEditor } from "@/components/shared/key-value-editor";
import { CodeInput } from "@/components/shared/code-input";
import { RefSelector } from "@/components/shared/ref-selector";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { createTeckelClient, type FieldInfo } from "@/lib/api/teckel-client";
import { useConnectionStore } from "@/stores/connection-store";

interface FormProps {
  config: Record<string, unknown>;
  onChange: (partial: Record<string, unknown>) => void;
  nodeId: string;
}

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

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
    />
  );
}

function CheckboxInput({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)] transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "parquet", label: "Parquet" },
  { value: "delta", label: "Delta" },
  { value: "orc", label: "ORC" },
  { value: "avro", label: "Avro" },
  { value: "text", label: "Text" },
  { value: "jdbc", label: "JDBC" },
];

const MODE_OPTIONS = [
  { value: "error", label: "Error if exists" },
  { value: "overwrite", label: "Overwrite" },
  { value: "append", label: "Append" },
  { value: "ignore", label: "Ignore" },
];

const JOIN_TYPE_OPTIONS = [
  { value: "inner", label: "Inner" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "outer", label: "Outer (Full)" },
  { value: "cross", label: "Cross" },
  { value: "left_semi", label: "Left Semi" },
  { value: "left_anti", label: "Left Anti" },
];

const FRAME_TYPE_OPTIONS = [
  { value: "rows", label: "Rows" },
  { value: "range", label: "Range" },
];

// --- Individual Forms ---

function SchemaTable({ fields, rowCount }: { fields: FieldInfo[]; rowCount: number }) {
  return (
    <div className="rounded-md border border-[var(--border)] overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
            <th className="px-2 py-1.5 text-left font-medium text-[var(--muted-foreground)]">Field</th>
            <th className="px-2 py-1.5 text-left font-medium text-[var(--muted-foreground)]">Type</th>
            <th className="px-2 py-1.5 text-center font-medium text-[var(--muted-foreground)]">Null</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="border-b border-[var(--border)] last:border-0">
              <td className="px-2 py-1 font-mono text-[var(--foreground)]">{f.name}</td>
              <td className="px-2 py-1 font-mono text-[var(--muted-foreground)]">{f.data_type}</td>
              <td className="px-2 py-1 text-center text-[var(--muted-foreground)]">{f.nullable ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-2 py-1 text-xs text-[var(--muted-foreground)]">
        {rowCount.toLocaleString()} rows
      </div>
    </div>
  );
}

function InputForm({ config, onChange }: FormProps) {
  const [schema, setSchema] = useState<{ fields: FieldInfo[]; rowCount: number } | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const serverUrl = useConnectionStore((s) => s.serverUrl);

  const handleInspect = async () => {
    const format = (config.format as string) || "parquet";
    const path = (config.path as string) || "";
    if (!path) return;

    setInspecting(true);
    setInspectError(null);
    setSchema(null);
    try {
      const client = createTeckelClient(serverUrl);
      const result = await client.inspectSource(
        format,
        path,
        (config.options as Record<string, string>) || {},
      );
      setSchema({ fields: result.fields, rowCount: result.row_count });
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : String(err));
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Format</Label>
        <SelectInput
          value={(config.format as string) || "parquet"}
          onChange={(v) => onChange({ format: v })}
          options={FORMAT_OPTIONS}
        />
      </div>
      <div>
        <Label>Path</Label>
        <TextInput
          value={(config.path as string) || ""}
          onChange={(v) => onChange({ path: v })}
          placeholder="/path/to/data"
          mono
        />
      </div>
      <div>
        <Label>Options</Label>
        <KeyValueEditor
          value={(config.options as Record<string, string>) || {}}
          onChange={(v) => onChange({ options: v })}
          keyPlaceholder="option"
          valuePlaceholder="value"
        />
      </div>
      <div>
        <button
          onClick={handleInspect}
          disabled={inspecting || !(config.path as string)}
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted)]/50 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inspecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
          {inspecting ? "Inspecting..." : "Inspect Schema"}
        </button>
        {inspectError && (
          <p className="mt-1.5 text-xs text-red-500">{inspectError}</p>
        )}
        {schema && (
          <div className="mt-2">
            <SchemaTable fields={schema.fields} rowCount={schema.rowCount} />
          </div>
        )}
      </div>
      <div>
        <Label>Description</Label>
        <TextInput
          value={(config.description as string) || ""}
          onChange={(v) => onChange({ description: v })}
          placeholder="Asset description..."
        />
      </div>
      <div>
        <Label>Owner</Label>
        <TextInput
          value={(config.owner as string) || ""}
          onChange={(v) => onChange({ owner: v })}
          placeholder="team or person"
        />
      </div>
      <div>
        <Label>Tags</Label>
        <TagInput
          value={(config.tags as string[]) || []}
          onChange={(v) => onChange({ tags: v })}
          placeholder="Add tag..."
        />
      </div>
      <div>
        <Label>Meta</Label>
        <KeyValueEditor
          value={(config.meta as Record<string, string>) || {}}
          onChange={(v) => onChange({ meta: v })}
          keyPlaceholder="key"
          valuePlaceholder="value"
        />
      </div>
    </div>
  );
}

function OutputForm({ config, onChange, nodeId }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Source Ref</Label>
        <RefSelector
          value={(config.ref as string) || ""}
          onChange={(v) => onChange({ ref: v })}
          excludeNodeId={nodeId}
          placeholder="Select source asset..."
        />
      </div>
      <div>
        <Label>Format</Label>
        <SelectInput
          value={(config.format as string) || "parquet"}
          onChange={(v) => onChange({ format: v })}
          options={FORMAT_OPTIONS}
        />
      </div>
      <div>
        <Label>Mode</Label>
        <SelectInput
          value={(config.mode as string) || "error"}
          onChange={(v) => onChange({ mode: v })}
          options={MODE_OPTIONS}
        />
      </div>
      <div>
        <Label>Path</Label>
        <TextInput
          value={(config.path as string) || ""}
          onChange={(v) => onChange({ path: v })}
          placeholder="/path/to/output"
          mono
        />
      </div>
      <div>
        <Label>Partition By</Label>
        <TagInput
          value={(config.partitionBy as string[]) || []}
          onChange={(v) => onChange({ partitionBy: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Options</Label>
        <KeyValueEditor
          value={(config.options as Record<string, string>) || {}}
          onChange={(v) => onChange({ options: v })}
        />
      </div>
      <div>
        <Label>Description</Label>
        <TextInput
          value={(config.description as string) || ""}
          onChange={(v) => onChange({ description: v })}
          placeholder="Output description..."
        />
      </div>
      <div>
        <Label>Tags</Label>
        <TagInput
          value={(config.tags as string[]) || []}
          onChange={(v) => onChange({ tags: v })}
          placeholder="Add tag..."
        />
      </div>
      <div>
        <Label>Freshness (ISO 8601)</Label>
        <TextInput
          value={(config.freshness as string) || ""}
          onChange={(v) => onChange({ freshness: v })}
          placeholder="P1D, PT12H..."
          mono
        />
      </div>
      <div>
        <Label>Maturity</Label>
        <SelectInput
          value={(config.maturity as string) || ""}
          onChange={(v) => onChange({ maturity: v })}
          options={[
            { value: "", label: "Not set" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
            { value: "deprecated", label: "Deprecated" },
          ]}
        />
      </div>
      <div>
        <Label>Meta</Label>
        <KeyValueEditor
          value={(config.meta as Record<string, string>) || {}}
          onChange={(v) => onChange({ meta: v })}
          keyPlaceholder="key"
          valuePlaceholder="value"
        />
      </div>
    </div>
  );
}

function SelectForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns / Expressions</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="col, expr as alias..."
        />
      </div>
    </div>
  );
}

function WhereForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Filter</Label>
        <CodeInput
          value={(config.filter as string) || ""}
          onChange={(v) => onChange({ filter: v })}
          placeholder="e.g. age > 18 AND status = 'active'"
        />
      </div>
    </div>
  );
}

function JoinForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Join Type</Label>
        <SelectInput
          value={(config.joinType as string) || "inner"}
          onChange={(v) => onChange({ joinType: v })}
          options={JOIN_TYPE_OPTIONS}
        />
      </div>
      <div>
        <Label>On (condition)</Label>
        <CodeInput
          value={(config.on as string) || ""}
          onChange={(v) => onChange({ on: v })}
          placeholder="e.g. left_asset.id = right_asset.id"
          rows={2}
        />
      </div>
    </div>
  );
}

function GroupByForm({ config, onChange }: FormProps) {
  const agg = (config.agg as string[]) || [];

  const addAgg = () => onChange({ agg: [...agg, ""] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, value: string) => {
    const next = agg.map((a, idx) => (idx === i ? value : a));
    onChange({ agg: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Group By Columns</Label>
        <TagInput
          value={(config.by as string[]) || []}
          onChange={(v) => onChange({ by: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAgg(i, e.target.value)}
                placeholder="sum(amount) as total"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAgg(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAgg}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderByForm({ config, onChange }: FormProps) {
  const columns = (config.columns as Array<{ column: string; direction: string; nulls: string }>) || [];

  const addCol = () => onChange({ columns: [...columns, { column: "", direction: "asc", nulls: "last" }] });
  const removeCol = (i: number) => onChange({ columns: columns.filter((_, idx) => idx !== i) });
  const updateCol = (i: number, field: string, value: string) => {
    const next = columns.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ columns: next });
  };

  return (
    <div className="space-y-3">
      <Label>Order By</Label>
      <div className="space-y-1.5">
        {columns.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={c.column}
              onChange={(e) => updateCol(i, "column", e.target.value)}
              placeholder="column"
              className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <select
              value={c.direction}
              onChange={(e) => updateCol(i, "direction", e.target.value)}
              className="h-7 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="asc">ASC</option>
              <option value="desc">DESC</option>
            </select>
            <select
              value={c.nulls}
              onChange={(e) => updateCol(i, "nulls", e.target.value)}
              className="h-7 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="last">Nulls Last</option>
              <option value="first">Nulls First</option>
            </select>
            <button
              type="button"
              onClick={() => removeCol(i)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCol}
          className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <Plus className="h-3 w-3" />
          Add column
        </button>
      </div>
    </div>
  );
}

function SqlForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>SQL Query</Label>
        <CodeInput
          value={(config.query as string) || ""}
          onChange={(v) => onChange({ query: v })}
          placeholder="SELECT * FROM my_view WHERE ..."
          rows={6}
        />
      </div>
      <div>
        <Label>Views (registered temp views)</Label>
        <TagInput
          value={(config.views as string[]) || []}
          onChange={(v) => onChange({ views: v })}
          placeholder="Add asset ref..."
        />
      </div>
    </div>
  );
}

function WindowForm({ config, onChange }: FormProps) {
  const orderBy = (config.orderBy as Array<{ column: string; direction: string; nulls: string }>) || [];
  const frame = (config.frame as { type: string; start: string; end: string }) || {
    type: "range", start: "unbounded preceding", end: "current row",
  };
  const functions = (config.functions as Array<{ expression: string; alias: string }>) || [];

  const addOrderBy = () => onChange({ orderBy: [...orderBy, { column: "", direction: "asc", nulls: "last" }] });
  const removeOrderBy = (i: number) => onChange({ orderBy: orderBy.filter((_, idx) => idx !== i) });
  const updateOrderBy = (i: number, field: string, value: string) => {
    const next = orderBy.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ orderBy: next });
  };

  const addFunc = () => onChange({ functions: [...functions, { expression: "", alias: "" }] });
  const removeFunc = (i: number) => onChange({ functions: functions.filter((_, idx) => idx !== i) });
  const updateFunc = (i: number, field: string, value: string) => {
    const next = functions.map((f, idx) => (idx === i ? { ...f, [field]: value } : f));
    onChange({ functions: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Partition By</Label>
        <TagInput
          value={(config.partitionBy as string[]) || []}
          onChange={(v) => onChange({ partitionBy: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Order By</Label>
        <div className="space-y-1.5">
          {orderBy.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={c.column}
                onChange={(e) => updateOrderBy(i, "column", e.target.value)}
                placeholder="column"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <select
                value={c.direction}
                onChange={(e) => updateOrderBy(i, "direction", e.target.value)}
                className="h-7 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
              <button
                type="button"
                onClick={() => removeOrderBy(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOrderBy}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add order column
          </button>
        </div>
      </div>
      <div>
        <Label>Frame</Label>
        <div className="space-y-1.5">
          <SelectInput
            value={frame.type || "range"}
            onChange={(v) => onChange({ frame: { ...frame, type: v } })}
            options={FRAME_TYPE_OPTIONS}
          />
          <TextInput
            value={frame.start || "unbounded preceding"}
            onChange={(v) => onChange({ frame: { ...frame, start: v } })}
            placeholder="unbounded preceding"
            mono
          />
          <TextInput
            value={frame.end || "current row"}
            onChange={(v) => onChange({ frame: { ...frame, end: v } })}
            placeholder="current row"
            mono
          />
        </div>
      </div>
      <div>
        <Label>Functions</Label>
        <div className="space-y-1.5">
          {functions.map((f, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <input
                  value={f.expression}
                  onChange={(e) => updateFunc(i, "expression", e.target.value)}
                  placeholder="row_number()"
                  className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <input
                  value={f.alias}
                  onChange={(e) => updateFunc(i, "alias", e.target.value)}
                  placeholder="alias"
                  className="h-7 w-24 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeFunc(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFunc}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add function
          </button>
        </div>
      </div>
    </div>
  );
}

function UnionForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Sources</Label>
        <TagInput
          value={(config.sources as string[]) || []}
          onChange={(v) => onChange({ sources: v })}
          placeholder="Add source ref..."
        />
      </div>
      <div>
        <CheckboxInput
          value={config.all !== false}
          onChange={(v) => onChange({ all: v })}
          label="UNION ALL (include duplicates)"
        />
      </div>
    </div>
  );
}

function IntersectForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Sources</Label>
        <TagInput
          value={(config.sources as string[]) || []}
          onChange={(v) => onChange({ sources: v })}
          placeholder="Add source ref..."
        />
      </div>
      <div>
        <CheckboxInput
          value={config.all === true}
          onChange={(v) => onChange({ all: v })}
          label="INTERSECT ALL (include duplicates)"
        />
      </div>
    </div>
  );
}

function ExceptForm({ config, onChange, nodeId }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Left</Label>
        <RefSelector
          value={(config.left as string) || ""}
          onChange={(v) => onChange({ left: v })}
          excludeNodeId={nodeId}
          placeholder="Select left asset..."
        />
      </div>
      <div>
        <Label>Right</Label>
        <RefSelector
          value={(config.right as string) || ""}
          onChange={(v) => onChange({ right: v })}
          excludeNodeId={nodeId}
          placeholder="Select right asset..."
        />
      </div>
      <div>
        <CheckboxInput
          value={config.all === true}
          onChange={(v) => onChange({ all: v })}
          label="EXCEPT ALL (include duplicates)"
        />
      </div>
    </div>
  );
}

function AddColumnsForm({ config, onChange }: FormProps) {
  const columns = (config.columns as Array<{ name: string; expression: string }>) || [];

  const addCol = () => onChange({ columns: [...columns, { name: "", expression: "" }] });
  const removeCol = (i: number) => onChange({ columns: columns.filter((_, idx) => idx !== i) });
  const updateCol = (i: number, field: string, value: string) => {
    const next = columns.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ columns: next });
  };

  return (
    <div className="space-y-3">
      <Label>Columns</Label>
      <div className="space-y-1.5">
        {columns.map((c, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <input
                value={c.name}
                onChange={(e) => updateCol(i, "name", e.target.value)}
                placeholder="column name"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeCol(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <input
              value={c.expression}
              onChange={(e) => updateCol(i, "expression", e.target.value)}
              placeholder="expression"
              className="h-7 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addCol}
          className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <Plus className="h-3 w-3" />
          Add column
        </button>
      </div>
    </div>
  );
}

function DropColumnsForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns to Drop</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
    </div>
  );
}

function RenameColumnsForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Column Mappings (old → new)</Label>
        <KeyValueEditor
          value={(config.mappings as Record<string, string>) || {}}
          onChange={(v) => onChange({ mappings: v })}
          keyPlaceholder="old name"
          valuePlaceholder="new name"
        />
      </div>
    </div>
  );
}

function CastColumnsForm({ config, onChange }: FormProps) {
  const columns = (config.columns as Array<{ name: string; targetType: string }>) || [];

  const addCol = () => onChange({ columns: [...columns, { name: "", targetType: "" }] });
  const removeCol = (i: number) => onChange({ columns: columns.filter((_, idx) => idx !== i) });
  const updateCol = (i: number, field: string, value: string) => {
    const next = columns.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ columns: next });
  };

  return (
    <div className="space-y-3">
      <Label>Cast Columns</Label>
      <div className="space-y-1.5">
        {columns.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              value={c.name}
              onChange={(e) => updateCol(i, "name", e.target.value)}
              placeholder="column"
              className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <input
              value={c.targetType}
              onChange={(e) => updateCol(i, "targetType", e.target.value)}
              placeholder="string, int, double..."
              className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeCol(i)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addCol}
          className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <Plus className="h-3 w-3" />
          Add column
        </button>
      </div>
    </div>
  );
}

function DistinctForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns (optional, empty = all)</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
    </div>
  );
}

function LimitForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Count</Label>
        <NumberInput
          value={(config.count as number) || 100}
          onChange={(v) => onChange({ count: v })}
          min={0}
        />
      </div>
    </div>
  );
}

function SampleForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Fraction (0-1)</Label>
        <NumberInput
          value={(config.fraction as number) || 0.1}
          onChange={(v) => onChange({ fraction: v })}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <CheckboxInput
          value={(config.withReplacement as boolean) || false}
          onChange={(v) => onChange({ withReplacement: v })}
          label="With Replacement"
        />
      </div>
      <div>
        <Label>Seed (optional)</Label>
        <NumberInput
          value={(config.seed as number) || 0}
          onChange={(v) => onChange({ seed: v || null })}
        />
      </div>
    </div>
  );
}

function PivotForm({ config, onChange }: FormProps) {
  const agg = (config.agg as string[]) || [];

  const addAgg = () => onChange({ agg: [...agg, ""] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, value: string) => {
    const next = agg.map((a, idx) => (idx === i ? value : a));
    onChange({ agg: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Group By</Label>
        <TagInput
          value={(config.groupBy as string[]) || []}
          onChange={(v) => onChange({ groupBy: v })}
          placeholder="Add grouping column..."
        />
      </div>
      <div>
        <Label>Pivot Column</Label>
        <TextInput
          value={(config.pivotColumn as string) || ""}
          onChange={(v) => onChange({ pivotColumn: v })}
          placeholder="column_name"
          mono
        />
      </div>
      <div>
        <Label>Values (optional)</Label>
        <TagInput
          value={(config.values as string[]) || []}
          onChange={(v) => onChange({ values: v })}
          placeholder="Add value..."
        />
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAgg(i, e.target.value)}
                placeholder="sum(amount)"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAgg(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAgg}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}

function UnpivotForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>ID Columns</Label>
        <TagInput
          value={(config.ids as string[]) || []}
          onChange={(v) => onChange({ ids: v })}
          placeholder="Add ID column..."
        />
      </div>
      <div>
        <Label>Value Columns</Label>
        <TagInput
          value={(config.values as string[]) || []}
          onChange={(v) => onChange({ values: v })}
          placeholder="Add value column..."
        />
      </div>
      <div>
        <Label>Variable Column Name</Label>
        <TextInput
          value={(config.variableColumn as string) || ""}
          onChange={(v) => onChange({ variableColumn: v })}
          placeholder="variable"
          mono
        />
      </div>
      <div>
        <Label>Value Column Name</Label>
        <TextInput
          value={(config.valueColumn as string) || ""}
          onChange={(v) => onChange({ valueColumn: v })}
          placeholder="value"
          mono
        />
      </div>
    </div>
  );
}

function RepartitionForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Number of Partitions</Label>
        <NumberInput
          value={(config.numPartitions as number) || 200}
          onChange={(v) => onChange({ numPartitions: v })}
          min={1}
        />
      </div>
      <div>
        <Label>Hash Columns (optional)</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
    </div>
  );
}

function CoalesceForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Number of Partitions</Label>
        <NumberInput
          value={(config.numPartitions as number) || 1}
          onChange={(v) => onChange({ numPartitions: v })}
          min={1}
        />
      </div>
    </div>
  );
}

function FlattenForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Separator</Label>
        <TextInput
          value={(config.separator as string) || "_"}
          onChange={(v) => onChange({ separator: v })}
          placeholder="_"
          mono
        />
      </div>
      <div>
        <CheckboxInput
          value={(config.explodeArrays as boolean) || false}
          onChange={(v) => onChange({ explodeArrays: v })}
          label="Explode arrays (one row per element)"
        />
      </div>
    </div>
  );
}

function ConditionalForm({ config, onChange }: FormProps) {
  const branches = (config.branches as Array<{ condition: string; value: string }>) || [];

  const addBranch = () => onChange({ branches: [...branches, { condition: "", value: "" }] });
  const removeBranch = (i: number) => onChange({ branches: branches.filter((_, idx) => idx !== i) });
  const updateBranch = (i: number, field: string, value: string) => {
    const next = branches.map((b, idx) => (idx === i ? { ...b, [field]: value } : b));
    onChange({ branches: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Output Column</Label>
        <TextInput
          value={(config.outputColumn as string) || ""}
          onChange={(v) => onChange({ outputColumn: v })}
          placeholder="result_column"
          mono
        />
      </div>
      <div>
        <Label>Branches (CASE WHEN)</Label>
        <div className="space-y-1.5">
          {branches.map((b, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <input
                  value={b.condition}
                  onChange={(e) => updateBranch(i, "condition", e.target.value)}
                  placeholder="WHEN condition"
                  className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeBranch(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <input
                value={b.value}
                onChange={(e) => updateBranch(i, "value", e.target.value)}
                placeholder="THEN value"
                className="h-7 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addBranch}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add branch
          </button>
        </div>
      </div>
      <div>
        <Label>Otherwise (ELSE)</Label>
        <TextInput
          value={(config.otherwise as string) || ""}
          onChange={(v) => onChange({ otherwise: v })}
          placeholder="default value (optional)"
          mono
        />
      </div>
    </div>
  );
}

function SplitForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Condition</Label>
        <CodeInput
          value={(config.condition as string) || ""}
          onChange={(v) => onChange({ condition: v })}
          placeholder="e.g. status = 'active'"
        />
      </div>
      <div>
        <Label>Pass Ref (condition = true)</Label>
        <TextInput
          value={(config.pass as string) || ""}
          onChange={(v) => onChange({ pass: v })}
          placeholder="pass_asset_name"
          mono
        />
      </div>
      <div>
        <Label>Fail Ref (condition = false/null)</Label>
        <TextInput
          value={(config.fail as string) || ""}
          onChange={(v) => onChange({ fail: v })}
          placeholder="fail_asset_name"
          mono
        />
      </div>
    </div>
  );
}

function RollupForm({ config, onChange }: FormProps) {
  const agg = (config.agg as string[]) || [];
  const addAgg = () => onChange({ agg: [...agg, ""] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, value: string) => {
    onChange({ agg: agg.map((a, idx) => (idx === i ? value : a)) });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Rollup By</Label>
        <TagInput
          value={(config.by as string[]) || []}
          onChange={(v) => onChange({ by: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAgg(i, e.target.value)}
                placeholder="sum(amount) as total"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button type="button" onClick={() => removeAgg(i)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addAgg} className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]">
            <Plus className="h-3 w-3" />
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}

function CubeForm({ config, onChange }: FormProps) {
  const agg = (config.agg as string[]) || [];
  const addAgg = () => onChange({ agg: [...agg, ""] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, value: string) => {
    onChange({ agg: agg.map((a, idx) => (idx === i ? value : a)) });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Cube By</Label>
        <TagInput
          value={(config.by as string[]) || []}
          onChange={(v) => onChange({ by: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAgg(i, e.target.value)}
                placeholder="sum(amount) as total"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button type="button" onClick={() => removeAgg(i)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addAgg} className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]">
            <Plus className="h-3 w-3" />
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}

function Scd2Form({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Key Columns (business key)</Label>
        <TagInput
          value={(config.keyColumns as string[]) || []}
          onChange={(v) => onChange({ keyColumns: v })}
          placeholder="Add key column..."
        />
      </div>
      <div>
        <Label>Track Columns (change detection)</Label>
        <TagInput
          value={(config.trackColumns as string[]) || []}
          onChange={(v) => onChange({ trackColumns: v })}
          placeholder="Add track column..."
        />
      </div>
      <div>
        <Label>Start Date Column</Label>
        <TextInput
          value={(config.startDateColumn as string) || ""}
          onChange={(v) => onChange({ startDateColumn: v })}
          placeholder="valid_from"
          mono
        />
      </div>
      <div>
        <Label>End Date Column</Label>
        <TextInput
          value={(config.endDateColumn as string) || ""}
          onChange={(v) => onChange({ endDateColumn: v })}
          placeholder="valid_to"
          mono
        />
      </div>
      <div>
        <Label>Current Flag Column</Label>
        <TextInput
          value={(config.currentFlagColumn as string) || ""}
          onChange={(v) => onChange({ currentFlagColumn: v })}
          placeholder="is_current"
          mono
        />
      </div>
    </div>
  );
}

function EnrichForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>URL</Label>
        <TextInput
          value={(config.url as string) || ""}
          onChange={(v) => onChange({ url: v })}
          placeholder="https://api.example.com/lookup/${keyColumn}"
          mono
        />
      </div>
      <div>
        <Label>Method</Label>
        <SelectInput
          value={(config.method as string) || "GET"}
          onChange={(v) => onChange({ method: v })}
          options={[
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" },
          ]}
        />
      </div>
      <div>
        <Label>Key Column</Label>
        <TextInput
          value={(config.keyColumn as string) || ""}
          onChange={(v) => onChange({ keyColumn: v })}
          placeholder="id"
          mono
        />
      </div>
      <div>
        <Label>Response Column</Label>
        <TextInput
          value={(config.responseColumn as string) || ""}
          onChange={(v) => onChange({ responseColumn: v })}
          placeholder="api_response"
          mono
        />
      </div>
      <div>
        <Label>Headers</Label>
        <KeyValueEditor
          value={(config.headers as Record<string, string>) || {}}
          onChange={(v) => onChange({ headers: v })}
          keyPlaceholder="header"
          valuePlaceholder="value"
        />
      </div>
      <div>
        <Label>On Error</Label>
        <SelectInput
          value={(config.onError as string) || "null"}
          onChange={(v) => onChange({ onError: v })}
          options={[
            { value: "null", label: "Null" },
            { value: "fail", label: "Fail" },
            { value: "skip", label: "Skip row" },
          ]}
        />
      </div>
      <div>
        <Label>Timeout (ms)</Label>
        <NumberInput
          value={(config.timeout as number) || 30000}
          onChange={(v) => onChange({ timeout: v })}
          min={0}
        />
      </div>
      <div>
        <Label>Max Retries</Label>
        <NumberInput
          value={(config.maxRetries as number) || 3}
          onChange={(v) => onChange({ maxRetries: v })}
          min={0}
        />
      </div>
    </div>
  );
}

function SchemaEnforceForm({ config, onChange }: FormProps) {
  const columns = (config.columns as Array<{ name: string; dataType: string; nullable: boolean; default?: string }>) || [];

  const addCol = () => onChange({ columns: [...columns, { name: "", dataType: "", nullable: true }] });
  const removeCol = (i: number) => onChange({ columns: columns.filter((_, idx) => idx !== i) });
  const updateCol = (i: number, field: string, value: unknown) => {
    const next = columns.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ columns: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Mode</Label>
        <SelectInput
          value={(config.mode as string) || "strict"}
          onChange={(v) => onChange({ mode: v })}
          options={[
            { value: "strict", label: "Strict" },
            { value: "evolve", label: "Evolve" },
          ]}
        />
      </div>
      <div>
        <Label>Schema Columns</Label>
        <div className="space-y-1.5">
          {columns.map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <input
                  value={c.name}
                  onChange={(e) => updateCol(i, "name", e.target.value)}
                  placeholder="column name"
                  className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <input
                  value={c.dataType}
                  onChange={(e) => updateCol(i, "dataType", e.target.value)}
                  placeholder="string, int..."
                  className="h-7 w-24 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <label className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                  <input
                    type="checkbox"
                    checked={c.nullable !== false}
                    onChange={(e) => updateCol(i, "nullable", e.target.checked)}
                    className="h-3 w-3"
                  />
                  null
                </label>
                <button
                  type="button"
                  onClick={() => removeCol(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addCol}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add column
          </button>
        </div>
      </div>
    </div>
  );
}

function AssertionForm({ config, onChange }: FormProps) {
  const checks = (config.checks as Array<{ column: string; rule: string; description: string }>) || [];

  const addCheck = () => onChange({ checks: [...checks, { column: "", rule: "", description: "" }] });
  const removeCheck = (i: number) => onChange({ checks: checks.filter((_, idx) => idx !== i) });
  const updateCheck = (i: number, field: string, value: string) => {
    const next = checks.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ checks: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>On Failure</Label>
        <SelectInput
          value={(config.onFailure as string) || "fail"}
          onChange={(v) => onChange({ onFailure: v })}
          options={[
            { value: "fail", label: "Fail pipeline" },
            { value: "warn", label: "Warn only" },
            { value: "drop", label: "Drop failing rows" },
          ]}
        />
      </div>
      <div>
        <Label>Checks</Label>
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <input
                  value={c.column}
                  onChange={(e) => updateCheck(i, "column", e.target.value)}
                  placeholder="column (optional)"
                  className="h-7 w-24 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <input
                  value={c.rule}
                  onChange={(e) => updateCheck(i, "rule", e.target.value)}
                  placeholder="not_null, unique, or condition"
                  className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeCheck(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <input
                value={c.description}
                onChange={(e) => updateCheck(i, "description", e.target.value)}
                placeholder="description (optional)"
                className="h-7 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addCheck}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add check
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Component</Label>
        <TextInput
          value={(config.component as string) || ""}
          onChange={(v) => onChange({ component: v })}
          placeholder="com.example.MyTransformer"
          mono
        />
      </div>
      <div>
        <Label>Options</Label>
        <KeyValueEditor
          value={(config.options as Record<string, string>) || {}}
          onChange={(v) => onChange({ options: v })}
          keyPlaceholder="key"
          valuePlaceholder="value"
        />
      </div>
    </div>
  );
}

// --- v3 Forms ---

function OffsetForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Count</Label>
        <NumberInput
          value={(config.count as number) || 0}
          onChange={(v) => onChange({ count: v })}
          min={0}
        />
      </div>
    </div>
  );
}

function TailForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Count</Label>
        <NumberInput
          value={(config.count as number) || 10}
          onChange={(v) => onChange({ count: v })}
          min={0}
        />
      </div>
    </div>
  );
}

function FillNaForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns (optional, empty = all)</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Value (fill all with this)</Label>
        <TextInput
          value={(config.value as string) || ""}
          onChange={(v) => onChange({ value: v })}
          placeholder="default value"
          mono
        />
      </div>
      <div>
        <Label>Values (per-column fill)</Label>
        <KeyValueEditor
          value={(config.values as Record<string, string>) || {}}
          onChange={(v) => onChange({ values: v })}
          keyPlaceholder="column"
          valuePlaceholder="fill value"
        />
      </div>
    </div>
  );
}

function DropNaForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns (optional, empty = all)</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>How</Label>
        <SelectInput
          value={(config.how as string) || "any"}
          onChange={(v) => onChange({ how: v })}
          options={[
            { value: "any", label: "Any (drop if any null)" },
            { value: "all", label: "All (drop if all null)" },
          ]}
        />
      </div>
      <div>
        <Label>Min Non-Nulls (optional)</Label>
        <NumberInput
          value={(config.minNonNulls as number) || 0}
          onChange={(v) => onChange({ minNonNulls: v || null })}
          min={0}
        />
      </div>
    </div>
  );
}

function ReplaceForm({ config, onChange }: FormProps) {
  const columns = (config.columns as string[]) || [];
  const mappings = (config.mappings as Array<{ old: string; new: string }>) || [];

  const addMapping = () => onChange({ mappings: [...mappings, { old: "", new: "" }] });
  const removeMapping = (i: number) => onChange({ mappings: mappings.filter((_, idx) => idx !== i) });
  const updateMapping = (i: number, field: string, value: string) => {
    const next = mappings.map((m, idx) => (idx === i ? { ...m, [field]: value } : m));
    onChange({ mappings: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Columns (optional, empty = all)</Label>
        <TagInput
          value={columns}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Mappings (old → new)</Label>
        <div className="space-y-1.5">
          {mappings.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={m.old}
                onChange={(e) => updateMapping(i, "old", e.target.value)}
                placeholder="old value"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <input
                value={m.new}
                onChange={(e) => updateMapping(i, "new", e.target.value)}
                placeholder="new value"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeMapping(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMapping}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add mapping
          </button>
        </div>
      </div>
    </div>
  );
}

function MergeForm({ config, onChange }: FormProps) {
  const whenMatched = (config.whenMatched as Array<{ action: string; condition: string; set: Record<string, string>; star: boolean }>) || [];
  const whenNotMatched = (config.whenNotMatched as Array<{ action: string; condition: string; set: Record<string, string>; star: boolean }>) || [];
  const whenNotMatchedBySource = (config.whenNotMatchedBySource as Array<{ action: string; condition: string; set: Record<string, string>; star: boolean }>) || [];

  const addClause = (key: string, clauses: unknown[]) => onChange({ [key]: [...clauses, { action: "update", condition: "", set: {}, star: false }] });
  const removeClause = (key: string, clauses: unknown[], i: number) => onChange({ [key]: (clauses as unknown[]).filter((_, idx) => idx !== i) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateClause = (key: string, clauses: any[], i: number, field: string, value: unknown) => {
    const next = clauses.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    onChange({ [key]: next });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderClauses = (label: string, key: string, clauses: any[]) => (
    <div>
      <Label>{label}</Label>
      <div className="space-y-1.5">
        {clauses.map((c, i) => (
          <div key={i} className="space-y-1 rounded border border-[var(--border)] p-2">
            <div className="flex items-center gap-1.5">
              <select
                value={c.action || "update"}
                onChange={(e) => updateClause(key, clauses, i, "action", e.target.value)}
                className="h-7 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="update">Update</option>
                <option value="insert">Insert</option>
                <option value="delete">Delete</option>
              </select>
              <input
                value={c.condition || ""}
                onChange={(e) => updateClause(key, clauses, i, "condition", e.target.value)}
                placeholder="condition (optional)"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <label className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={c.star === true}
                  onChange={(e) => updateClause(key, clauses, i, "star", e.target.checked)}
                  className="h-3 w-3"
                />
                *
              </label>
              <button
                type="button"
                onClick={() => removeClause(key, clauses, i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <KeyValueEditor
              value={(c.set as Record<string, string>) || {}}
              onChange={(v) => updateClause(key, clauses, i, "set", v)}
              keyPlaceholder="column"
              valuePlaceholder="expression"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => addClause(key, clauses)}
          className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <Plus className="h-3 w-3" />
          Add clause
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <Label>On (join keys)</Label>
        <TagInput
          value={(config.on as string[]) || []}
          onChange={(v) => onChange({ on: v })}
          placeholder="Add key column..."
        />
      </div>
      {renderClauses("When Matched", "whenMatched", whenMatched)}
      {renderClauses("When Not Matched", "whenNotMatched", whenNotMatched)}
      {renderClauses("When Not Matched By Source", "whenNotMatchedBySource", whenNotMatchedBySource)}
    </div>
  );
}

function ParseForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Column</Label>
        <TextInput
          value={(config.column as string) || ""}
          onChange={(v) => onChange({ column: v })}
          placeholder="column_name"
          mono
        />
      </div>
      <div>
        <Label>Format</Label>
        <SelectInput
          value={(config.format as string) || "json"}
          onChange={(v) => onChange({ format: v })}
          options={[
            { value: "json", label: "JSON" },
            { value: "csv", label: "CSV" },
          ]}
        />
      </div>
      <div>
        <Label>Options</Label>
        <KeyValueEditor
          value={(config.options as Record<string, string>) || {}}
          onChange={(v) => onChange({ options: v })}
          keyPlaceholder="option"
          valuePlaceholder="value"
        />
      </div>
    </div>
  );
}

function AsOfJoinForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Left As-Of Column</Label>
        <TextInput
          value={(config.leftAsOf as string) || ""}
          onChange={(v) => onChange({ leftAsOf: v })}
          placeholder="timestamp_column"
          mono
        />
      </div>
      <div>
        <Label>Right As-Of Column</Label>
        <TextInput
          value={(config.rightAsOf as string) || ""}
          onChange={(v) => onChange({ rightAsOf: v })}
          placeholder="timestamp_column"
          mono
        />
      </div>
      <div>
        <Label>Direction</Label>
        <SelectInput
          value={(config.direction as string) || "backward"}
          onChange={(v) => onChange({ direction: v })}
          options={[
            { value: "backward", label: "Backward" },
            { value: "forward", label: "Forward" },
            { value: "nearest", label: "Nearest" },
          ]}
        />
      </div>
      <div>
        <Label>Tolerance (optional)</Label>
        <TextInput
          value={(config.tolerance as string) || ""}
          onChange={(v) => onChange({ tolerance: v })}
          placeholder="e.g. 1 hour, 30 minutes"
          mono
        />
      </div>
      <div>
        <CheckboxInput
          value={config.allowExactMatches !== false}
          onChange={(v) => onChange({ allowExactMatches: v })}
          label="Allow exact matches"
        />
      </div>
    </div>
  );
}

function LateralJoinForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Join Type</Label>
        <SelectInput
          value={(config.type as string) || "inner"}
          onChange={(v) => onChange({ type: v })}
          options={[
            { value: "inner", label: "Inner" },
            { value: "left", label: "Left" },
          ]}
        />
      </div>
      <div>
        <Label>On (conditions)</Label>
        <TagInput
          value={(config.on as string[]) || []}
          onChange={(v) => onChange({ on: v })}
          placeholder="Add condition..."
        />
      </div>
    </div>
  );
}

function TransposeForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Index Columns</Label>
        <TagInput
          value={(config.indexColumns as string[]) || []}
          onChange={(v) => onChange({ indexColumns: v })}
          placeholder="Add column..."
        />
      </div>
    </div>
  );
}

function GroupingSetsForm({ config, onChange }: FormProps) {
  const sets = (config.sets as string[][]) || [[]];
  const agg = (config.agg as string[]) || [];

  const addSet = () => onChange({ sets: [...sets, []] });
  const removeSet = (i: number) => onChange({ sets: sets.filter((_, idx) => idx !== i) });
  const updateSet = (i: number, value: string[]) => {
    const next = sets.map((s, idx) => (idx === i ? value : s));
    onChange({ sets: next });
  };

  const addAgg = () => onChange({ agg: [...agg, ""] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, value: string) => {
    onChange({ agg: agg.map((a, idx) => (idx === i ? value : a)) });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Grouping Sets</Label>
        <div className="space-y-1.5">
          {sets.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="flex-1">
                <TagInput
                  value={s}
                  onChange={(v) => updateSet(i, v)}
                  placeholder="Add column to set..."
                />
              </div>
              <button
                type="button"
                onClick={() => removeSet(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSet}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add set
          </button>
        </div>
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a}
                onChange={(e) => updateAgg(i, e.target.value)}
                placeholder="sum(amount) as total"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAgg(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addAgg}
            className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <Plus className="h-3 w-3" />
            Add aggregation
          </button>
        </div>
      </div>
    </div>
  );
}

function DescribeForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns (optional, empty = all)</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Statistics (optional)</Label>
        <TagInput
          value={(config.statistics as string[]) || []}
          onChange={(v) => onChange({ statistics: v })}
          placeholder="count, mean, stddev..."
        />
      </div>
    </div>
  );
}

function CrosstabForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Column 1</Label>
        <TextInput
          value={(config.col1 as string) || ""}
          onChange={(v) => onChange({ col1: v })}
          placeholder="column_name"
          mono
        />
      </div>
      <div>
        <Label>Column 2</Label>
        <TextInput
          value={(config.col2 as string) || ""}
          onChange={(v) => onChange({ col2: v })}
          placeholder="column_name"
          mono
        />
      </div>
    </div>
  );
}

function HintForm({ config, onChange }: FormProps) {
  const hints = (config.hints as Array<{ name: string; parameters?: Record<string, string> }>) || [];

  const addHint = () => onChange({ hints: [...hints, { name: "" }] });
  const removeHint = (i: number) => onChange({ hints: hints.filter((_, idx) => idx !== i) });
  const updateHintName = (i: number, value: string) => {
    const next = hints.map((h, idx) => (idx === i ? { ...h, name: value } : h));
    onChange({ hints: next });
  };
  const updateHintParams = (i: number, value: Record<string, string>) => {
    const next = hints.map((h, idx) => (idx === i ? { ...h, parameters: value } : h));
    onChange({ hints: next });
  };

  return (
    <div className="space-y-3">
      <Label>Hints</Label>
      <div className="space-y-1.5">
        {hints.map((h, i) => (
          <div key={i} className="space-y-1 rounded border border-[var(--border)] p-2">
            <div className="flex items-center gap-1.5">
              <input
                value={h.name}
                onChange={(e) => updateHintName(i, e.target.value)}
                placeholder="hint name (e.g. broadcast)"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeHint(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <KeyValueEditor
              value={(h.parameters as Record<string, string>) || {}}
              onChange={(v) => updateHintParams(i, v)}
              keyPlaceholder="parameter"
              valuePlaceholder="value"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addHint}
          className="flex h-7 items-center gap-1 rounded px-2 text-[10px] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
        >
          <Plus className="h-3 w-3" />
          Add hint
        </button>
      </div>
    </div>
  );
}

// --- Form Registry ---

const FORM_MAP: Record<TeckelNodeType, React.ComponentType<FormProps>> = {
  input: InputForm,
  output: OutputForm,
  select: SelectForm,
  where: WhereForm,
  join: JoinForm,
  groupBy: GroupByForm,
  orderBy: OrderByForm,
  sql: SqlForm,
  window: WindowForm,
  union: UnionForm,
  intersect: IntersectForm,
  except: ExceptForm,
  addColumns: AddColumnsForm,
  dropColumns: DropColumnsForm,
  renameColumns: RenameColumnsForm,
  castColumns: CastColumnsForm,
  distinct: DistinctForm,
  limit: LimitForm,
  sample: SampleForm,
  pivot: PivotForm,
  unpivot: UnpivotForm,
  repartition: RepartitionForm,
  coalesce: CoalesceForm,
  flatten: FlattenForm,
  conditional: ConditionalForm,
  split: SplitForm,
  rollup: RollupForm,
  cube: CubeForm,
  scd2: Scd2Form,
  enrich: EnrichForm,
  schemaEnforce: SchemaEnforceForm,
  assertion: AssertionForm,
  custom: CustomForm,
  // v3 transformations
  offset: OffsetForm,
  tail: TailForm,
  fillNa: FillNaForm,
  dropNa: DropNaForm,
  replace: ReplaceForm,
  merge: MergeForm,
  parse: ParseForm,
  asOfJoin: AsOfJoinForm,
  lateralJoin: LateralJoinForm,
  transpose: TransposeForm,
  groupingSets: GroupingSetsForm,
  describe: DescribeForm,
  crosstab: CrosstabForm,
  hint: HintForm,
};

export function NodeConfigForm({
  nodeType,
  config,
  onChange,
  nodeId,
  onBeforeChange,
}: {
  nodeType: TeckelNodeType;
  config: Record<string, unknown>;
  onChange: (partial: Record<string, unknown>) => void;
  nodeId: string;
  onBeforeChange?: () => void;
}) {
  const Form = FORM_MAP[nodeType];
  const hasFocused = useRef(false);

  const handleFocus = useCallback(() => {
    if (!hasFocused.current && onBeforeChange) {
      hasFocused.current = true;
      onBeforeChange();
    }
  }, [onBeforeChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    // Reset when focus leaves the entire form (not just moving between fields)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      hasFocused.current = false;
    }
  }, []);

  return (
    <div onFocusCapture={handleFocus} onBlur={handleBlur}>
      <Form config={config} onChange={onChange} nodeId={nodeId} />
    </div>
  );
}
