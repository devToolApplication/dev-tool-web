# Frontend UI Rules

## Classification

- `shared/component`
  Use only for small UI primitives and input-like controls.
  Examples: button wrappers, input controls, tags, toggles, small reusable atoms.

- `shared/ui`
  Use for larger composed UI blocks that already contain layout, grouping, or page-level presentation logic.
  Examples: `base-crud-page`, table blocks, form renderer blocks, guide panels, summary panels.

## Styling

- Prefer app tokens and existing utility classes already used across the app.
- Reuse classes such as `rounded-2xl`, `border-surface-200`, `bg-surface-0`, `bg-surface-50`, `text-surface-500`, `shadow-sm`, `p-*`, `gap-*`.
- Do not add a dedicated component CSS file for a UI block if the layout can be expressed cleanly with existing utility/token classes.
- Add component-specific CSS only when:
  - utility classes cannot express the layout clearly
  - the component needs non-trivial responsive behavior
  - the component needs custom animation, chart styling, or third-party override styling

## Page Composition

- Large page sections should not declare native markup repeatedly inside feature screens if the same pattern can become a reusable `shared/ui` block.
- Feature screens should mostly compose shared UI blocks and pass data/config into them.
- Keep business logic in the feature screen, but move reusable presentation structure into `shared/ui`.

## Review Checklist

- Is this a small primitive? Put it in `shared/component`.
- Is this a composed section/panel/block? Put it in `shared/ui`.
- Are you introducing a new CSS file? Check first whether app utility/token classes already solve it.
- Is the feature screen holding too much layout markup? Extract the repeated block into `shared/ui`.
