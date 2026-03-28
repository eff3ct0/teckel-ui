import type { Monaco } from "@monaco-editor/react";

// Extract model and position types from the Monaco completion provider signature
type ProvideCompletionItems = Parameters<Monaco["languages"]["registerCompletionItemProvider"]>[1]["provideCompletionItems"];
type ITextModel = Parameters<NonNullable<ProvideCompletionItems>>[0];
type Position = Parameters<NonNullable<ProvideCompletionItems>>[1];

// ---------------------------------------------------------------------------
// Function catalogue – grouped by category (from teckel-spec v2.0 section 9.6)
// ---------------------------------------------------------------------------

interface FunctionDef {
  name: string;
  insertText: string;
  detail: string;
  category: string;
}

const FUNCTIONS: FunctionDef[] = [
  // Aggregate
  { name: "count", insertText: "count(${1:expr})", detail: "count(expr) - Aggregate count", category: "Aggregate" },
  { name: "sum", insertText: "sum(${1:expr})", detail: "sum(expr) - Aggregate sum", category: "Aggregate" },
  { name: "avg", insertText: "avg(${1:expr})", detail: "avg(expr) - Aggregate average", category: "Aggregate" },
  { name: "min", insertText: "min(${1:expr})", detail: "min(expr) - Aggregate minimum", category: "Aggregate" },
  { name: "max", insertText: "max(${1:expr})", detail: "max(expr) - Aggregate maximum", category: "Aggregate" },

  // String
  { name: "concat", insertText: "concat(${1:expr1}, ${2:expr2})", detail: "concat(expr1, expr2) - Concatenate strings", category: "String" },
  { name: "upper", insertText: "upper(${1:expr})", detail: "upper(expr) - Convert to uppercase", category: "String" },
  { name: "lower", insertText: "lower(${1:expr})", detail: "lower(expr) - Convert to lowercase", category: "String" },
  { name: "trim", insertText: "trim(${1:expr})", detail: "trim(expr) - Remove leading/trailing whitespace", category: "String" },
  { name: "ltrim", insertText: "ltrim(${1:expr})", detail: "ltrim(expr) - Remove leading whitespace", category: "String" },
  { name: "rtrim", insertText: "rtrim(${1:expr})", detail: "rtrim(expr) - Remove trailing whitespace", category: "String" },
  { name: "length", insertText: "length(${1:expr})", detail: "length(expr) - String length", category: "String" },
  { name: "substring", insertText: "substring(${1:expr}, ${2:start}, ${3:length})", detail: "substring(expr, start, length) - Extract substring", category: "String" },
  { name: "replace", insertText: "replace(${1:expr}, ${2:from}, ${3:to})", detail: "replace(expr, from, to) - Replace occurrences", category: "String" },

  // Numeric
  { name: "abs", insertText: "abs(${1:expr})", detail: "abs(expr) - Absolute value", category: "Numeric" },
  { name: "round", insertText: "round(${1:expr}, ${2:decimals})", detail: "round(expr, decimals) - Round number", category: "Numeric" },
  { name: "floor", insertText: "floor(${1:expr})", detail: "floor(expr) - Round down", category: "Numeric" },
  { name: "ceil", insertText: "ceil(${1:expr})", detail: "ceil(expr) - Round up", category: "Numeric" },
  { name: "power", insertText: "power(${1:base}, ${2:exp})", detail: "power(base, exp) - Exponentiation", category: "Numeric" },
  { name: "sqrt", insertText: "sqrt(${1:expr})", detail: "sqrt(expr) - Square root", category: "Numeric" },
  { name: "mod", insertText: "mod(${1:a}, ${2:b})", detail: "mod(a, b) - Modulo", category: "Numeric" },

  // Date/Time
  { name: "current_date", insertText: "current_date()", detail: "current_date() - Current date", category: "Date/Time" },
  { name: "current_timestamp", insertText: "current_timestamp()", detail: "current_timestamp() - Current timestamp", category: "Date/Time" },
  { name: "year", insertText: "year(${1:date})", detail: "year(date) - Extract year", category: "Date/Time" },
  { name: "month", insertText: "month(${1:date})", detail: "month(date) - Extract month", category: "Date/Time" },
  { name: "day", insertText: "day(${1:date})", detail: "day(date) - Extract day", category: "Date/Time" },
  { name: "hour", insertText: "hour(${1:timestamp})", detail: "hour(timestamp) - Extract hour", category: "Date/Time" },
  { name: "minute", insertText: "minute(${1:timestamp})", detail: "minute(timestamp) - Extract minute", category: "Date/Time" },
  { name: "second", insertText: "second(${1:timestamp})", detail: "second(timestamp) - Extract second", category: "Date/Time" },
  { name: "date_add", insertText: "date_add(${1:date}, ${2:interval})", detail: "date_add(date, interval) - Add interval to date", category: "Date/Time" },
  { name: "date_diff", insertText: "date_diff(${1:date1}, ${2:date2})", detail: "date_diff(date1, date2) - Difference between dates", category: "Date/Time" },
  { name: "to_date", insertText: "to_date(${1:expr}, ${2:format})", detail: "to_date(expr, format) - Parse to date", category: "Date/Time" },
  { name: "to_timestamp", insertText: "to_timestamp(${1:expr}, ${2:format})", detail: "to_timestamp(expr, format) - Parse to timestamp", category: "Date/Time" },

  // Window
  { name: "row_number", insertText: "row_number()", detail: "row_number() - Sequential row number", category: "Window" },
  { name: "rank", insertText: "rank()", detail: "rank() - Rank with gaps", category: "Window" },
  { name: "dense_rank", insertText: "dense_rank()", detail: "dense_rank() - Rank without gaps", category: "Window" },
  { name: "lag", insertText: "lag(${1:expr}, ${2:offset})", detail: "lag(expr, offset) - Previous row value", category: "Window" },
  { name: "lead", insertText: "lead(${1:expr}, ${2:offset})", detail: "lead(expr, offset) - Next row value", category: "Window" },
  { name: "first_value", insertText: "first_value(${1:expr})", detail: "first_value(expr) - First value in window", category: "Window" },
  { name: "last_value", insertText: "last_value(${1:expr})", detail: "last_value(expr) - Last value in window", category: "Window" },
  { name: "ntile", insertText: "ntile(${1:n})", detail: "ntile(n) - Divide into n buckets", category: "Window" },

  // Conditional
  { name: "coalesce", insertText: "coalesce(${1:expr1}, ${2:expr2})", detail: "coalesce(expr1, expr2, ...) - First non-null value", category: "Conditional" },
  { name: "nullif", insertText: "nullif(${1:expr1}, ${2:expr2})", detail: "nullif(expr1, expr2) - Null if equal", category: "Conditional" },
  { name: "ifnull", insertText: "ifnull(${1:expr}, ${2:default})", detail: "ifnull(expr, default) - Default if null", category: "Conditional" },
];

const KEYWORDS = [
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "CAST", "AS",
  "AND", "OR", "NOT",
  "IS", "NULL", "IN", "BETWEEN", "LIKE", "DISTINCT",
  "TRUE", "FALSE",
  "ASC", "DESC",
  "OVER", "PARTITION", "BY", "ORDER",
  "ROWS", "RANGE", "UNBOUNDED", "PRECEDING", "FOLLOWING", "CURRENT", "ROW",
];

// ---------------------------------------------------------------------------
// Category label mapping for completion item grouping
// ---------------------------------------------------------------------------

const CATEGORY_SORT: Record<string, string> = {
  Aggregate: "0",
  String: "1",
  Numeric: "2",
  "Date/Time": "3",
  Window: "4",
  Conditional: "5",
};

// ---------------------------------------------------------------------------
// Public entry-point
// ---------------------------------------------------------------------------

export function registerTeckelLanguage(monaco: Monaco): void {
  // Avoid double-registration
  const languages = monaco.languages.getLanguages();
  if (languages.some((lang: { id: string }) => lang.id === "teckel")) return;

  // 1. Register language id
  monaco.languages.register({ id: "teckel" });

  // 2. Monarch tokenizer for syntax highlighting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monaco.languages.setMonarchTokensProvider("teckel", {
    ignoreCase: true,

    keywords: KEYWORDS.map((k) => k.toLowerCase()),

    functions: FUNCTIONS.map((f) => f.name),

    operators: ["+", "-", "*", "/", "=", "!=", "<>", "<", ">", "<=", ">=", "||"],

    tokenizer: {
      root: [
        // Line comments
        [/--.*$/, "comment"],

        // String literals
        [/'[^']*'/, "string"],

        // Numbers
        [/\d+(\.\d+)?/, "number"],

        // Identifiers & keywords / functions
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              "@keywords": "keyword",
              "@functions": "predefined",
              "@default": "identifier",
            },
          },
        ],

        // Operators
        [/[<>!=]+/, "operator"],
        [/\|\|/, "operator"],
        [/[+\-*/]/, "operator"],

        // Whitespace
        [/\s+/, "white"],

        // Delimiters
        [/[(),]/, "delimiter"],
      ],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // 3. Completion provider
  monaco.languages.registerCompletionItemProvider("teckel", {
    provideCompletionItems(model: ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [];

      // Function completions
      for (const fn of FUNCTIONS) {
        const sortPrefix = CATEGORY_SORT[fn.category] ?? "9";
        suggestions.push({
          label: fn.name,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: fn.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `[${fn.category}] ${fn.detail}`,
          sortText: `${sortPrefix}_${fn.name}`,
          range,
        });
      }

      // Keyword completions
      for (const kw of KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: "Keyword",
          sortText: `9_${kw}`,
          range,
        });
      }

      return { suggestions };
    },
  });

  // 4. Hover provider – show function signature on hover
  monaco.languages.registerHoverProvider("teckel", {
    provideHover(model: ITextModel, position: Position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const token = word.word.toLowerCase();
      const fn = FUNCTIONS.find((f) => f.name === token);
      if (!fn) return null;

      return {
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        },
        contents: [
          { value: `**${fn.category}**` },
          { value: `\`${fn.detail}\`` },
        ],
      };
    },
  });
}
