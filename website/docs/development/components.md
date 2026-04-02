---
sidebar_position: 2
title: Components
---

# Components

Teckel Editor's UI is organized into modular component directories under `src/components/`.

## Component directories

### `canvas/`

The React Flow canvas where the pipeline graph is rendered. Handles node rendering, edge drawing, pan/zoom, selection, and the toolbar with layout and action buttons.

### `config/`

The right-side configuration panel. Opens when a node is selected and renders a form specific to the node type. Uses React Hook Form with Zod schemas for validation.

### `nodes/`

Custom React Flow node components. Each node renders with its category color, icon (from Lucide), label, and ref name. Handles connection handles (source/target ports) and validation error badges.

### `palette/`

The left sidebar showing all 49 node types organized by category. Uses dnd-kit for drag-and-drop onto the canvas. Nodes are rendered from the `NODE_REGISTRY` with their icons and labels.

### `edges/`

Custom React Flow edge components for the data flow connections between nodes.

### `topbar/`

The top navigation bar containing:
- Pipeline name (editable)
- Validation status indicator
- Run/Cancel buttons
- Settings access
- Connection health indicator

### `yaml/`

The YAML editor panel using Monaco Editor. Provides syntax highlighting, error markers, and bidirectional sync with the visual graph.

### `explain/`

The execution plan viewer. Displays the output of the `ExplainPipeline` RPC call.

### `jobs/`

Job history and status panel. Shows submitted jobs with their lifecycle status, timestamps, and duration.

### `templates/`

Template management for reusable transformation patterns.

### `shared/`

Shared components used across multiple panels (buttons, dialogs, icons, etc.).

### `ui/`

Low-level UI primitives wrapping Radix UI components with consistent styling:
- Accordion, Dialog, Dropdown Menu, Popover
- Select, Switch, Tabs, Tooltip
- Label, Separator, Scroll Area, Slot

## UI primitives

The project uses [Radix UI](https://www.radix-ui.com/) for accessible, unstyled primitives:

| Component | Radix Package |
|---|---|
| Accordion | `@radix-ui/react-accordion` |
| Dialog | `@radix-ui/react-dialog` |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` |
| Label | `@radix-ui/react-label` |
| Popover | `@radix-ui/react-popover` |
| Scroll Area | `@radix-ui/react-scroll-area` |
| Select | `@radix-ui/react-select` |
| Separator | `@radix-ui/react-separator` |
| Slot | `@radix-ui/react-slot` |
| Switch | `@radix-ui/react-switch` |
| Tabs | `@radix-ui/react-tabs` |
| Tooltip | `@radix-ui/react-tooltip` |

## Styling

All components are styled with **Tailwind CSS 4** using utility classes. The project uses:

- `clsx` and `tailwind-merge` for conditional class merging
- `class-variance-authority` (CVA) for component variants
- Lucide React for icons
- Framer Motion for animations
