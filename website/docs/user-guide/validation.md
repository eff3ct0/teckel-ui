---
sidebar_position: 3
title: Validation
---

# Validation

Teckel Editor uses a **two-tier validation** system that provides both instant feedback and thorough server-side checking.

![Validation flow](/img/diagrams/validation-flow.svg)

## Client-side validation (instant)

Client-side validation runs immediately as you edit the pipeline. It catches common errors without requiring a backend connection:

- **Zod schemas** — Each node type has a Zod schema that validates its configuration (required fields, correct types, valid values).
- **AssetRef format** — Node reference names are validated to ensure they follow the `snake_case` naming convention required by the Teckel spec.
- **Cycle detection** — The graph is checked for cycles, which would prevent topological sorting and YAML generation.
- **Edge validity** — Connections are validated to ensure they follow the correct data flow patterns (e.g., input nodes cannot have incoming edges).

Client-side errors appear immediately on the affected nodes as colored badges.

## Server-side validation (debounced)

Server-side validation sends the generated YAML to the Teckel Engine for full spec validation. This catches errors that require the complete pipeline context:

- **Full spec validation** — The YAML is validated against the complete Teckel v3.0 specification, including cross-references and expression parsing.
- **Debounced** — Validation requests are debounced at **800ms** to avoid overwhelming the server during rapid editing.
- **Variables included** — Pipeline variables are sent along with the YAML so that `${VAR_NAME}` references can be resolved.

The server returns either `{valid: true}` or `{valid: false, error: "..."}`.

## Error display

Validation errors are displayed in the **topbar** at the top of the editor:

- **Green indicator** — Pipeline is valid
- **Red indicator** — Pipeline has errors; click to see details

Node-level errors are also shown as badges on the affected nodes in the canvas.

## Validation flow

```
User edits pipeline
       |
       v
Client-side validation (instant)
       |
       v
Zod schemas + cycle detection + ref format
       |
       v
Generate YAML
       |
       v  (debounced 800ms)
Server-side validation (gRPC ValidatePipeline)
       |
       v
Display results in topbar + node badges
```
