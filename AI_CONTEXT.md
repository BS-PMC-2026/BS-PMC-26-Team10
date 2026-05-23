# ChiliLand — AI Context

Quick orientation for AI-assisted work on this project.

---

## Project Summary

| | |
|---|---|
| Frontend | React 19 + Vite 8 |
| Routing | React Router 7 |
| Styling | Plain CSS per component/page, no CSS-in-JS |
| Icons | `lucide-react` throughout the visitor UI |
| Backend | FastAPI at `http://127.0.0.1:8000` |
| Database | PostgreSQL via Supabase |
| File storage | Supabase storage (`tours-booking-images`, `chilli-images`, `product-images` buckets) |
| Tests | Vitest + @testing-library/react (frontend), pytest + FastAPI TestClient (backend) |

---

## Frontend Routes

```
/                   → VisitorMain        (landing page)
/products           → VisitorProducts    (shop / inventory)
/pepper/:id         → PepperDetailsPage  (chilli detail)
/tours              → ToursPage          (public tour listing + FAQ + calendar)
/tours/:id          → TourDetailPage     (single tour + booking form)
/about              → AboutPage
/farm-location      → FarmLocation
/staffLogin         → Auth               (login / signup)
/owner              → OwnerMain          (owner dashboard)
/owner/:section     → OwnerMain
/tourguide          → TourguideMain      (guide dashboard)
```

The routes `/`, `/products`, `/pepper/:id`, `/tours`, `/tours/:id`, `/about`, and `/farm-location` are wrapped in `VisitorLayout` (in `App.jsx`), which renders the `Navbar` alongside the page. Staff routes (`/owner`, `/tourguide`, `/staffLogin`) do **not** get the navbar.

---

## Frontend Structure

```
src/
  App.jsx                         ← route definitions + VisitorLayout
  main.jsx
  assets/
    header-desk.mp4
    header-mob.mp4
    hero.png
    image4–7.jpeg / imgae1–3.jpeg
    owner.png
  components/
    Navbar/                       ← left-side vertical nav rail (visitor only)
    HeaderVisitor/                ← full-viewport hero with looping video
    WelcomeStrip/                 ← four value cards below the hero
    VisitorCatalogue/             ← chilli catalogue with search + filters
    VisitorCart/                  ← shopping cart sidebar
    CheckoutModel/                ← checkout flow modal
    FooterVisitor/                ← site footer
    TourCard/                     ← admin-facing tour card (with bookings toggle)
    TourFormModal/                ← edit-tour modal for owner
    CreateTourPage/               ← create-tour form for owner
    TourGrid/                     ← grid of TourCards used in OwnerMain
    OwnerDashboard/
    OwnerCardsGrid/
    OwnerPanelCard/
    OwnerSidebar/
    GuideSidebar/
    InventoryCard/
    InventoryGrid/
    InventoryFormModal/
    ChilliFormModal/
  pages/
    VisitorMain.jsx
    VisitorProducts.jsx
    PepperDetailsPage.jsx
    ToursPage.jsx
    TourDetailPage.jsx
    AboutPage.jsx
    FarmLocation.jsx
    Auth.jsx
    OwnerMain.jsx
    TourguideMain.jsx
  styles/
    AboutPage.css
    FarmLocation.css
    OwnerInventory.css
    OwnerMain.css
    OwnerOrders.css
    TourDetailPage.css
    TourguideMain.css
    ToursPage.css
    VisitorMain.css          ← legacy file, largely unused
    VisitorProducts.css
    auth.css
    pepperDetailsPage.css
  tests/
    TourCard.test.jsx
    TourImageUpload.test.jsx
    ToursPage.test.jsx
```

---

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| Primary red | `#bb3e22` | CTAs, active states, accent dots |
| Dark brown | `rgba(45, 24, 13, ...)` / `#2d180d` | Navbar background, overlays |
| Cream | `#fff4e6` | Text on dark backgrounds |
| Hover red | `#a8341b` | Primary button hover |

### Typography

The site currently uses the **system font stack** — no custom fonts are loaded.

```css
/* from src/index.css */
--sans:    system-ui, 'Segoe UI', Roboto, sans-serif;
--heading: system-ui, 'Segoe UI', Roboto, sans-serif;
--mono:    ui-monospace, Consolas, monospace;
```

When generating new UI, match this convention:
- **Headings**: `font-weight: 700`, sized in `vw` units for marketing sections, `rem` for UI components
- **Labels / buttons**: `font-weight: 600`
- **Body**: `font-weight: 400`, `line-height: 1.6–1.7`
- **Kicker text** (small uppercase labels above headings): `font-size: 1vw`, `letter-spacing: 0.16vw`, `text-transform: uppercase`

### Spacing & Sizing

- **vw-based units** throughout marketing/hero sections (responsive without breakpoints)
- **rem-based units** in UI components (forms, modals, cards)
- **Border radius**: `999vw` for pill shapes; `1–1.4vw` for cards
- **Transitions**: `0.25s ease` standard; `0.32s cubic-bezier(0.4, 0, 0.2, 1)` for slide animations

### Icons

Use `lucide-react` for all icons. Common icons already in use:
`Flame`, `Users`, `Package`, `GraduationCap`, `Sprout`, `FlaskConical`, `MapPin`, `ShoppingCart`, `ShoppingBag`, `Tractor`, `Camera`, `Car`, `Compass`, `Bus`, `Phone`, `Mail`, `Home`, `Info`, `LogIn`, `Menu`, `X`

---

## Backend API

Base URL: `http://127.0.0.1:8000`

### Chillies
```
GET    /chillies                  ?shu_min= &shu_max= &origin=
GET    /chillies/{id}
GET    /chillies/search?q=        ⚠ route ordering bug: defined after /{id}, returns 422
POST   /chillies
DELETE /chillies/{id}
POST   /chillies/upload-image
```

### Inventory (products)
```
GET    /inventory
GET    /inventory/{id}
POST   /inventory/add
PUT    /inventory/{id}
DELETE /inventory/{id}
POST   /inventory/upload-image
POST   /inventory/upload-ingredients-image
```

### Tours
```
GET    /tours
POST   /tours
PUT    /tours/{id}
DELETE /tours/{id}
POST   /tours/upload-image        ⚠ must be defined BEFORE /tours/{id} in router
```

### Bookings
```
GET    /tours/{tour_id}/bookings
POST   /bookings
POST   /bookings/{reference}/cancel
```

### FAQ
```
GET    /faq
```

### Orders
```
GET    /orders
GET    /orders/recent
POST   /orders
```

### Promo codes
```
GET    /codes
POST   /codes
PUT    /codes/{id}
DELETE /codes/{id}
POST   /validate
```

---

## Known Issues

- `GET /chillies/search` is defined after `GET /chillies/{chilli_id}` in the router, so FastAPI matches "search" as an integer param and returns 422. Fix: move the search route above the `{id}` route.
- `src/styles/VisitorMain.css` is legacy from an older non-component architecture; largely unused.
- No real authentication — the Auth page navigates by role without a backend auth call.

---

## Run Commands

**Frontend** (from repo root):
```bash
npm install
npm run dev
```

**Backend** (from `Backend/`):
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Tests**:
```bash
npm run test            # frontend (Vitest)
cd Backend && pytest    # backend (pytest)
```
