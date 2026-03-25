"use client";

import type { TeckelNodeType } from "@/types/pipeline";
import { TagInput } from "@/components/shared/tag-input";
import { KeyValueEditor } from "@/components/shared/key-value-editor";
import { CodeInput } from "@/components/shared/code-input";
import { RefSelector } from "@/components/shared/ref-selector";
import { Plus, X } from "lucide-react";

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
  { value: "overwrite", label: "Overwrite" },
  { value: "append", label: "Append" },
  { value: "ignore", label: "Ignore" },
  { value: "error", label: "Error if exists" },
];

const JOIN_TYPE_OPTIONS = [
  { value: "inner", label: "Inner" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "full", label: "Full" },
  { value: "cross", label: "Cross" },
  { value: "semi", label: "Semi" },
  { value: "anti", label: "Anti" },
];

// --- Individual Forms ---

function InputForm({ config, onChange }: FormProps) {
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
          value={(config.mode as string) || "overwrite"}
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
    </div>
  );
}

function SelectForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Columns</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column name..."
        />
      </div>
    </div>
  );
}

function WhereForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Condition</Label>
        <CodeInput
          value={(config.condition as string) || ""}
          onChange={(v) => onChange({ condition: v })}
          placeholder="e.g. age > 18 AND status = 'active'"
        />
      </div>
    </div>
  );
}

function JoinForm({ config, onChange, nodeId }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Join With</Label>
        <RefSelector
          value={(config.ref as string) || ""}
          onChange={(v) => onChange({ ref: v })}
          excludeNodeId={nodeId}
          placeholder="Select asset to join..."
        />
      </div>
      <div>
        <Label>Join Type</Label>
        <SelectInput
          value={(config.joinType as string) || "inner"}
          onChange={(v) => onChange({ joinType: v })}
          options={JOIN_TYPE_OPTIONS}
        />
      </div>
      <div>
        <Label>On</Label>
        <CodeInput
          value={(config.on as string) || ""}
          onChange={(v) => onChange({ on: v })}
          placeholder="e.g. a.id = b.id"
          rows={2}
        />
      </div>
    </div>
  );
}

function GroupByForm({ config, onChange }: FormProps) {
  const agg = (config.agg as Array<{ column: string; function: string }>) || [];

  const addAgg = () => onChange({ agg: [...agg, { column: "", function: "" }] });
  const removeAgg = (i: number) => onChange({ agg: agg.filter((_, idx) => idx !== i) });
  const updateAgg = (i: number, field: string, value: string) => {
    const next = agg.map((a, idx) => (idx === i ? { ...a, [field]: value } : a));
    onChange({ agg: next });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Group By Columns</Label>
        <TagInput
          value={(config.columns as string[]) || []}
          onChange={(v) => onChange({ columns: v })}
          placeholder="Add column..."
        />
      </div>
      <div>
        <Label>Aggregations</Label>
        <div className="space-y-1.5">
          {agg.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={a.column}
                onChange={(e) => updateAgg(i, "column", e.target.value)}
                placeholder="column"
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <input
                value={a.function}
                onChange={(e) => updateAgg(i, "function", e.target.value)}
                placeholder="sum, avg, count..."
                className="h-7 flex-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 font-mono text-[10px] text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeAgg(i)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
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
  const columns = (config.columns as Array<{ column: string; direction: string }>) || [];

  const addCol = () => onChange({ columns: [...columns, { column: "", direction: "asc" }] });
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
          placeholder="SELECT * FROM {ref} WHERE ..."
          rows={6}
        />
      </div>
    </div>
  );
}

function WindowForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Partition By</Label>
        <TagInput
          value={(config.partitionBy as string[]) || []}
          onChange={(v) => onChange({ partitionBy: v })}
        />
      </div>
      <div>
        <Label>Order By</Label>
        <TagInput
          value={(config.orderBy as string[]) || []}
          onChange={(v) => onChange({ orderBy: v })}
        />
      </div>
    </div>
  );
}

function MultiRefForm({ config, onChange, nodeId }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>References</Label>
        <TagInput
          value={(config.refs as string[]) || []}
          onChange={(v) => onChange({ refs: v })}
          placeholder="Add ref name..."
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
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
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
        <Label>Column Mapping (old → new)</Label>
        <KeyValueEditor
          value={(config.mapping as Record<string, string>) || {}}
          onChange={(v) => onChange({ mapping: v })}
          keyPlaceholder="old name"
          valuePlaceholder="new name"
        />
      </div>
    </div>
  );
}

function CastColumnsForm({ config, onChange }: FormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Column → Type</Label>
        <KeyValueEditor
          value={(config.mapping as Record<string, string>) || {}}
          onChange={(v) => onChange({ mapping: v })}
          keyPlaceholder="column"
          valuePlaceholder="string, int, double..."
        />
      </div>
    </div>
  );
}

function DistinctForm(_props: FormProps) {
  return (
    <div className="py-2 text-xs text-[var(--muted-foreground)]">
      No additional configuration needed.
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
          min={1}
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
  return (
    <div className="space-y-3">
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
        <Label>Values</Label>
        <TagInput
          value={(config.values as string[]) || []}
          onChange={(v) => onChange({ values: v })}
          placeholder="Add value..."
        />
      </div>
      <div>
        <Label>Aggregation (column → function)</Label>
        <KeyValueEditor
          value={(config.agg as Record<string, string>) || {}}
          onChange={(v) => onChange({ agg: v })}
          keyPlaceholder="column"
          valuePlaceholder="sum, avg..."
        />
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
          value={(config.idColumns as string[]) || []}
          onChange={(v) => onChange({ idColumns: v })}
          placeholder="Add ID column..."
        />
      </div>
      <div>
        <Label>Value Columns</Label>
        <TagInput
          value={(config.valueColumns as string[]) || []}
          onChange={(v) => onChange({ valueColumns: v })}
          placeholder="Add value column..."
        />
      </div>
    </div>
  );
}

function PartitionForm({
  config,
  onChange,
  label,
}: FormProps & { label: string }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <NumberInput
          value={(config.numPartitions as number) || 1}
          onChange={(v) => onChange({ numPartitions: v })}
          min={1}
        />
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
  union: MultiRefForm,
  intersect: MultiRefForm,
  except: MultiRefForm,
  addColumns: AddColumnsForm,
  dropColumns: DropColumnsForm,
  renameColumns: RenameColumnsForm,
  castColumns: CastColumnsForm,
  distinct: DistinctForm,
  limit: LimitForm,
  sample: SampleForm,
  pivot: PivotForm,
  unpivot: UnpivotForm,
  repartition: (props: FormProps) => <PartitionForm {...props} label="Number of Partitions" />,
  coalesce: (props: FormProps) => <PartitionForm {...props} label="Number of Partitions" />,
};

export function NodeConfigForm({
  nodeType,
  config,
  onChange,
  nodeId,
}: {
  nodeType: TeckelNodeType;
  config: Record<string, unknown>;
  onChange: (partial: Record<string, unknown>) => void;
  nodeId: string;
}) {
  const Form = FORM_MAP[nodeType];
  return <Form config={config} onChange={onChange} nodeId={nodeId} />;
}
