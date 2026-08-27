# Frontend Design Contract

Source of truth: `.agents/DESIGN.md`, interpreted by `.agents/WORKPLAN.md`.

## Visual identity

VDA Ledger uses a technical, meditative, dark-green full-bleed canvas. White supplies readable foreground and neutral controls. Lime (`#C8F542`) is reserved for primary emphasis, focus, selected state, and key technical metadata. Translucent white glass panels sit over the dark field.

Authenticated application pages must not become a generic white SaaS dashboard. Semantic success, warning, danger, and information colors may be added only where status meaning requires them.

## Color roles

| Role | Value |
|---|---|
| Primary/accent/focus | `#C8F542` |
| Secondary dark green | `#12300F` |
| Tertiary dark green | `#0D3617` |
| Neutral/primary foreground | `#FFFFFF` |
| Deep atmospheric shell stop | `rgb(10, 42, 18)` |
| Default glass surface | `rgba(255, 255, 255, 0.09)` |
| Default glass border | `rgba(255, 255, 255, 0.14)` |
| Secondary-control border | `rgba(255, 255, 255, 0.18)` |

Semantic variables must include background, foreground, surface, muted surface, border, primary, primary foreground, muted foreground, success, warning, danger, and information roles. Repeated raw hex values must not be scattered across page components.

## Typography

- Family: Geist for display, body, and utility text.
- Display large: 54.4px, weight 400, line-height 60.928px, letter-spacing `-0.05em`.
- Body medium: 14px, weight 400, line-height 22.75px.
- Label medium: 12px, weight 500, line-height 16px.
- Numeric and code-like metadata may use Geist Mono when available.
- Display headings may scale down responsively, but must not exceed the 54.4px display token without a documented exception.

## Layout and density

- Composition: strong grid, full-bleed structural frame.
- Base rhythm: 4px.
- Allowed scale: 4, 6, 8, 10, 12, 14, 16, and 20px.
- Section padding: 28px and 40px.
- Card padding variants: 10, 14, 16, 17, and 20px.
- Primary content should use edge padding rather than oversized generic centered-dashboard whitespace.
- Data-heavy views should remain compact and readable.

## Material and elevation

Default glass panel:

```text
background: rgba(255, 255, 255, 0.09)
border: 0.8px solid rgba(255, 255, 255, 0.14)
radius: 16px
backdrop blur: 12px
shadow: rgba(0, 0, 0, 0.3) 0 20px 40px -12px
```

Approved supporting shadows:

- `rgba(10, 42, 18, 0.45) 0 40px 80px -20px`
- `rgba(200, 245, 66, 0.4) 0 8px 24px -6px`

Important large surfaces may use a gradient shell:

```css
linear-gradient(
  160deg,
  rgb(10, 42, 18) 0%,
  rgb(13, 54, 23) 45%,
  rgb(10, 42, 18) 100%
)
```

The shell radius is 28px with a slightly smaller inner radius. It is reserved for a major hero, dashboard composition, upload form, principal tax summary, or significant detail surface. Small cards do not each receive a gradient shell.

## Shape system

- Radii: 2, 8, 12, 16, 28px, and full pill.
- Linear icon treatment.
- Existing Lucide icons are retained as the practical installed linear set; no additional icon dependency is required.
- Status cannot be conveyed by icon or color alone; visible text remains mandatory.

## Buttons

- Primary: white background, `#0D3617` foreground, full pill radius, compact spacing, no decorative gradient.
- Secondary: white foreground, translucent border, transparent/glass background, full pill radius.
- Link: unboxed text treatment where a plain inline action is appropriate.
- All variants require visible lime focus, loading, disabled, hover/brightness, and adequate touch target behavior.
- Motion duration: 150ms.

## Forms

- Every input has a visible label or an accessible label plus visible contextual heading.
- Inputs use readable white foreground over a dark/glass surface.
- Placeholder text is supplemental, never the only label.
- Errors are associated with the affected control and announced.
- Focus uses the lime semantic focus ring.
- File upload preserves the selected file after recoverable backend errors.

## Tables

- Semantic `table`, headings, and row cells.
- Dense header labels using the label/mono treatment.
- Comparable numbers use tabular alignment and deliberate right alignment where useful.
- Table regions may scroll horizontally, but the page itself must not.
- Wide tables receive a purpose-built mobile card representation.
- Critical IDs remain revealable/copyable and are not silently truncated.

## Navigation and shell

- Desktop: fixed left application navigation with a selected lime-accent state and one coherent content canvas.
- Mobile/tablet: top bar plus controlled drawer.
- Drawer requirements: labelled dialog semantics, Escape close, overlay close, focus placement/restoration, scroll locking, and active-route state.
- Navigation must not include unsupported routes.
- Sign-out and identity changes must clear protected cached data.

## Feedback states

- Loading skeletons match final geometry and expose an announced loading label.
- Empty states explain what is absent and the next valid action.
- Authentication-required, authorization-denied, not-found, conflict/validation, rate-limit, connectivity/configuration, and backend failure states use distinct titles and recovery guidance.
- Backend or infrastructure failures never silently become numeric zeroes.
- Error UI must not reveal tokens, stack traces, SQL text, internal class names, or secrets.

## WebGL and fallback

- Full-bleed shader background with soft lime bloom/haze, slow breathing pulse, and subtle pointer drift.
- DPR is clamped.
- Reduced-motion disables continuous animation.
- A dark DOM/CSS radial/linear field and diagonal hatch remain fully readable when WebGL is unavailable.
- The effect never blocks interaction or becomes a visual competitor on authenticated data-heavy screens.

## Responsive contract

Verify at approximately 390, 768, 1024, and 1440px:

- no document-level horizontal overflow;
- usable navigation and visible primary actions;
- data tables constrained to their own region or replaced on mobile;
- dialogs/drawers fit the viewport;
- headings do not exceed the viewport;
- cards remain compact;
- forms and touch controls remain usable.

## Page-specific contract

- Landing: real capabilities only; no testimonials, customer logos, fake adoption metrics, live-price promises, filing claims, or unsupported exchange claims.
- Dashboard: independent real endpoint states; no fake trends or chart data.
- Upload: synchronous multipart fields `exchange` and `file`; exact result counters.
- Ingestions: newest-first history, real identifiers/statuses, distinct owned-not-found result.
- Ledger: full backend list with presentation-only filtering; no edit/delete actions.
- Portfolio: quantity-only holdings; unavailable market values are not shown as zero.
- Tax: backend report only, supported year selection, explicit exclusive period boundary, surcharge null shown as not calculated, and estimate disclaimer.
- Profile: Clerk account management plus backend identity; no fake persistence controls.

## Prohibited patterns

- Generic white dashboard styling.
- Arbitrary accent colors, gradients, radii, spacing, or shadows.
- Oversized display typography outside the contract.
- Decorative or fake charts.
- Fabricated business values or silent zero fallbacks.
- Frontend FIFO, holding, gain, loss, tax, TDS, or cess calculations.
- Excessive motion, glass on every nested element, and inaccessible color-only status.

