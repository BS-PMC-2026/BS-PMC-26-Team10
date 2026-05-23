# ChiliLand — Frontend Guidelines

---

## Tech Stack

| Tool | Version |
|---|---|
| React | 19 |
| Vite | 8 |
| React Router | 7 |
| Icon library | `lucide-react` |
| Styling | Plain CSS files (no CSS-in-JS, no Tailwind) |
| Testing | Vitest + @testing-library/react + @testing-library/user-event |

---

## App Architecture

### Route Layout

`src/App.jsx` splits routes into two groups:

**Visitor routes** — wrapped in `VisitorLayout`, which renders `<Navbar />` alongside the page:
- `/` → `VisitorMain`
- `/products` → `VisitorProducts`
- `/pepper/:id` → `PepperDetailsPage`
- `/tours` → `ToursPage`
- `/tours/:id` → `TourDetailPage`
- `/about` → `AboutPage`
- `/farm-location` → `FarmLocation`

**Staff routes** — rendered directly, no navbar:
- `/staffLogin` → `Auth`
- `/owner` / `/owner/:section` → `OwnerMain`
- `/tourguide` → `TourguideMain`

### Navbar

`src/components/Navbar/Navbar.jsx` is a fixed left-side vertical rail. Key behaviour:
- **Collapsed** by default on desktop (`5.2vw` wide); **expands to `13vw`** on hover to reveal link labels
- On the **landing page only** (`/`), the navbar is hidden while the hero video is in view and slides in after the user scrolls past it (uses `IntersectionObserver` on `.farm-header`)
- On **mobile** (≤768px): renders as a left-side slide-in drawer toggled by a hamburger button

### Visitor Page Composition

`VisitorMain` assembles the landing page from:
1. `HeaderVisitor` — full-viewport hero with looping `<video>` (desktop + mobile variants)
2. `WelcomeStrip` — four static value cards
3. `VisitorCatalogue` — chilli catalogue with search, origin filter, SHU range filter
4. `FooterVisitor`

---

## Design System

### Color Palette

```css
--primary-red:    #bb3e22      /* CTAs, active links, accent marks */
--primary-hover:  #a8341b      /* primary button hover */
--dark-brown:     #2d180d      /* navbar, overlays (often with alpha) */
--cream:          #fff4e6      /* text on dark backgrounds */
--cream-muted:    rgba(255, 244, 230, 0.68)  /* inactive nav labels */
```

These are not CSS custom properties in the codebase yet — they are the design tokens implied by the existing components. Use these values directly when writing new styles.

### Typography

The site uses the **system font stack** — no custom fonts are loaded:

```css
font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
```

When writing new UI, follow these conventions:

| Context | Size | Weight | Notes |
|---|---|---|---|
| Hero headline | `4.6vw` | 700 | Scales with viewport |
| Section heading | `2–2.4vw` | 700 | Use `rem` in UI components |
| Kicker / eyebrow | `1vw` | 600 | `text-transform: uppercase`, `letter-spacing: 0.16vw` |
| Body copy | `1.2vw` | 400 | `line-height: 1.6–1.7` |
| Button / label | `1vw` | 600 | |
| Navbar icon label | `0.85vw` | 600 | Hidden until nav expands |

### Spacing

- Marketing/hero sections: **vw-based** (`padding: 2vw`, `gap: 1.5vw`)
- UI components (modals, forms, cards): **rem-based** (`padding: 1rem`, `gap: 0.75rem`)
- Never mix vw and rem arbitrarily — choose based on whether the element lives in a marketing context or a functional UI context

### Border Radius

- **Pill shapes**: `border-radius: 999vw` (buttons, badges, tags)
- **Cards**: `border-radius: 1–1.4vw`
- **Modals / panels**: `border-radius: 0.8–1.2rem`

### Transitions

```css
/* standard interactive */
transition: 0.25s ease;

/* slide / expand animations */
transition: 0.32s cubic-bezier(0.4, 0, 0.2, 1);
```

### Icons

Use `lucide-react` for all icons. Do not use emoji as icons in UI components.

Consistent stroke widths:
- `strokeWidth={1.6}` — resting / inactive state
- `strokeWidth={2.2}` — active / selected state

Common icons already in use across the site:
`Flame`, `Users`, `Package`, `GraduationCap`, `Sprout`, `FlaskConical`, `MapPin`, `ShoppingCart`, `ShoppingBag`, `Tractor`, `Camera`, `Car`, `Compass`, `Bus`, `Phone`, `Mail`, `Home`, `Info`, `LogIn`, `Menu`, `X`

---

## Coding Standards

### React

- Functional components only
- Keep state local unless clearly shared between sibling components
- Use hooks (`useEffect`, `useState`, `useRef`) for side effects and derived state
- Component files: `PascalCase.jsx`; variables and functions: `camelCase`
- Page files are compositional — move non-trivial UI into component files

### CSS

- One CSS file per component, co-located in the component folder
- Page-level styles live in `src/styles/`
- Class names: `kebab-case` with a feature prefix (e.g. `tours-grid-card`, `navbar-link--active`)
- No inline styles except computed values (e.g. `backgroundImage` for dynamic URLs)
- Mobile breakpoints: `768px` (mobile), `1024px` (tablet)
- Never override `#root` constraints in component CSS

### API Calls

- Backend base URL: `http://127.0.0.1:8000` (hardcoded; no env abstraction yet)
- Every fetch must handle three states: **loading**, **success**, **error**
- Add an **empty state** where the result can be an empty array

### Comments

Write no comments unless the *why* is non-obvious. Do not write docstrings, task references, or "added for X" comments.

---

## Component Responsibilities

| Component | Owner | Purpose |
|---|---|---|
| `Navbar` | Visitor | Left rail nav; hidden on hero section of landing page |
| `HeaderVisitor` | Visitor | Hero video + CTA buttons |
| `WelcomeStrip` | Visitor | Four static value cards |
| `VisitorCatalogue` | Visitor | Chilli catalogue with filters |
| `VisitorCart` | Visitor | Slide-in cart sidebar |
| `CheckoutModel` | Visitor | Checkout flow modal |
| `FooterVisitor` | Visitor | Site footer |
| `TourCard` | Owner | Tour card with inline booking viewer |
| `TourFormModal` | Owner | Edit-tour modal |
| `CreateTourPage` | Owner | Create-tour form (embedded in owner flow) |
| `TourGrid` | Owner | Grid of `TourCard` components |
| `OwnerDashboard` | Owner | Dashboard stats |
| `OwnerSidebar` | Owner | Left sidebar for owner navigation |
| `GuideSidebar` | Guide | Left sidebar for guide navigation |
| `InventoryCard` | Owner | Single product card |
| `InventoryGrid` | Owner | Grid of `InventoryCard` |
| `InventoryFormModal` | Owner | Add/edit inventory item modal |
| `ChilliFormModal` | Owner | Add/edit chilli modal |

---

## Testing

Frontend tests live in `src/tests/`. Run with:
```bash
npm run test
```

Backend tests live in `Backend/tests/`. Run with:
```bash
cd Backend && pytest
```

### Frontend testing conventions

- Use `@testing-library/react` + `@testing-library/user-event`
- Mock `fetch` with `vi.stubGlobal("fetch", ...)` and restore with `vi.unstubAllGlobals()` in `afterEach`
- File inputs: use `id`/`htmlFor` pairing so `getByLabelText` works; simulate upload with `userEvent.upload`
- Always test loading, success, error, and empty states for data-fetching components

---

## Known Issues

| Issue | Location | Notes |
|---|---|---|
| `/chillies/search` returns 422 | `Backend/app/routes/chilli.py` | Route defined after `/{id}`, so "search" is treated as an integer param. Fix: move above `/{id}`. |
| No real authentication | `Auth.jsx` | Navigation after login is role-based but there is no backend auth call |
| `VisitorMain.css` is legacy | `src/styles/VisitorMain.css` | Left over from a pre-component architecture. Avoid adding to it. |

---

## Change Guidance

- When adding a new visitor-facing page, add it inside the `VisitorLayout` route group in `App.jsx`
- When adding a new route, update `AI_CONTEXT.md` and this file
- Prefer editing existing component CSS over adding new stylesheets
- When changing a backend endpoint, update `AI_CONTEXT.md` backend section
- Image uploads use Supabase storage — use the existing `upload_image` helper in `Backend/app/db2.py`
- For new tour or chilli image endpoints, keep `POST /resource/upload-image` **before** `GET /resource/{id}` in the router to avoid FastAPI route shadowing
