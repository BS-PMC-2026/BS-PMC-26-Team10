# ChiliLand Frontend Guidelines

## Project Overview

ChiliLand is a React frontend for a chilli farm experience site. The current implementation is centered on the visitor-facing experience, with early scaffolding for staff authentication and future owner and tour guide dashboards.

## Tech Stack

- React 19 with functional components
- Vite 8 for development and build tooling
- React Router 7 for client-side routing
- Plain CSS files scoped by page or component
- Fetch API for backend communication

## Current Frontend Architecture

### App Shell

[`src/App.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/App.jsx) defines four routes:

- `/` renders [`src/pages/VisitorMain.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/VisitorMain.jsx)
- `/staffLogin` renders [`src/pages/Auth.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/Auth.jsx)
- `/owner` renders [`src/pages/OwnerMain.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/OwnerMain.jsx)
- `/tourguide` renders [`src/pages/TourguideMain.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/TourguideMain.jsx)

### Visitor Page Composition

The visitor page is built from:

- [`src/components/HeaderVisitor/HeaderVisitor.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/HeaderVisitor/HeaderVisitor.jsx)
- [`src/components/WelcomeStrip/WelcomeStrip.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/WelcomeStrip/WelcomeStrip.jsx)
- [`src/components/VisitorCatalogue/VisitorCatalogue.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/VisitorCatalogue/VisitorCatalogue.jsx)
- [`src/components/FooterVisitor/FooterVisitor.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/FooterVisitor/FooterVisitor.jsx)

### Auth Page

[`src/pages/Auth.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/Auth.jsx) is a local-state screen with:

- Login and signup tabs
- Role selection on signup
- Client-side navigation only
- No API integration yet

## Folder Structure

```text
src/
  App.jsx
  main.jsx
  assets/
    header-desk.mp4
    header-mob.mp4
    hero.png
  components/
    FooterVisitor/
      FooterVisitor.css
      FooterVisitor.jsx
    HeaderVisitor/
      HeaderVisitor.css
      HeaderVisitor.jsx
    VisitorCatalogue/
      VisitorCatalogue.css
      VisitorCatalogue.jsx
    WelcomeStrip/
      WelcomeStrip.css
      WelcomeStrip.jsx
  pages/
    Auth.jsx
    OwnerMain.jsx
    TourguideMain.jsx
    VisitorMain.jsx
  styles/
    auth.css
    VisitorMain.css
```

## Coding Standards

### React

- Prefer functional components
- Keep state local unless shared state is clearly needed
- Use hooks for side effects and derived query state
- Keep page files compositional and move UI sections into components

### Naming

- Component files: PascalCase
- React components: PascalCase
- Variables and functions: camelCase
- CSS classes: kebab-case with feature prefixes when useful

### Styling

- Keep component-specific styles next to the component when already structured that way
- Use page-level styles only for page-specific layout or resets
- Preserve the existing warm red farm-brand palette unless the team intentionally redesigns it
- Match existing responsive behavior for hero, cards, filters, and auth layout

### API Calls

- The visitor catalogue currently hardcodes `http://127.0.0.1:8000`
- Fetch logic lives in [`src/components/VisitorCatalogue/VisitorCatalogue.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/VisitorCatalogue/VisitorCatalogue.jsx)
- Keep loading, empty, and error states visible in the UI

## Current Design Direction

The frontend is not a generic dashboard. The implemented UI leans toward a branded visitor experience:

- Full-width hero with looping background video
- Warm red and cream palette
- Marketing copy focused on tours, products, and family visits
- Card-based chilli catalogue
- Mobile and desktop variants for the hero media

## Backend Contract

The FastAPI app is in [`Backend/main.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/main.py).

Current backend routes:

- `GET /chillies`
- `GET /chillies/search?q=...`
- `POST /chillies`
- `GET /inventory`
- `POST /inventory/add`

Filtering is implemented on the same `GET /chillies` route via query parameters:

- `shu_min`
- `shu_max`
- `origin`

Static images are served from:

- `/chilli_images`
- `/product_images`

Inventory data lives in the `inventory` table and includes:

- `id`
- `name`
- `description`
- `quantity`
- `last_updated`
- `restock_date`
- `price`
- `image_url`

Database setup helpers now live under:

- [`Backend/db/sql/create_inventory_table.sql`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/sql/create_inventory_table.sql)
- [`Backend/db/scripts/create_inventory_table.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/scripts/create_inventory_table.py)
- [`Backend/db/scripts/load_peppers.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/scripts/load_peppers.py)

## Important Current Mismatches

- The auth page navigates guests and visitors to `/visitor`, but the router only defines `/`
- [`src/styles/VisitorMain.css`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/styles/VisitorMain.css) looks like legacy styling from an earlier non-React version and does not appear to drive the current visitor components
- The frontend still has no consumer for `GET /inventory`

## Change Guidance

When editing the frontend:

- Keep visitor-facing components modular
- Prefer updating the existing component tree instead of reintroducing a monolithic page file
- Reuse the current assets before adding new media
- If a route or endpoint is changed, update both the code and the markdown docs
- Document temporary placeholders and known gaps explicitly instead of describing unfinished work as complete

## Testing Expectations

At minimum, verify:

- `npm run dev` starts the Vite app
- `/`, `/staffLogin`, `/owner`, and `/tourguide` render without crashes
- The catalogue shows loading, empty, and error states appropriately
- The backend is reachable at `http://127.0.0.1:8000` when testing catalogue data
- Inventory requests should use `GET /inventory` and `POST /inventory/add` if/when a frontend inventory screen is added
