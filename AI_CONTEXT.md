# ChiliLand Frontend - AI Context

Use this file as a quick orientation note for AI-assisted work on the ChiliLand frontend.

## Project Summary

- Frontend framework: React with Vite
- Routing: React Router
- Main implemented experience: visitor landing page
- Supporting screens: auth page plus placeholder owner and tour guide pages
- Backend: FastAPI at `http://127.0.0.1:8000`
- Backend also exposes inventory/product endpoints and static product images

## Current Routes

- `/` -> visitor homepage
- `/staffLogin` -> login/signup UI
- `/owner` -> placeholder owner page
- `/tourguide` -> placeholder tour guide page

## Frontend Structure

```text
src/
  App.jsx
  main.jsx
  components/
    HeaderVisitor/
    WelcomeStrip/
    VisitorCatalogue/
    FooterVisitor/
  pages/
    VisitorMain.jsx
    Auth.jsx
    OwnerMain.jsx
    TourguideMain.jsx
  styles/
    auth.css
    VisitorMain.css
```

## Component Responsibilities

### VisitorMain

[`src/pages/VisitorMain.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/VisitorMain.jsx) composes the visitor homepage from four sections:

- hero
- welcome strip
- catalogue
- footer

### HeaderVisitor

[`src/components/HeaderVisitor/HeaderVisitor.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/HeaderVisitor/HeaderVisitor.jsx) renders:

- desktop and mobile background videos
- hero copy
- two CTA buttons

### WelcomeStrip

[`src/components/WelcomeStrip/WelcomeStrip.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/WelcomeStrip/WelcomeStrip.jsx) renders a static set of four value cards.

### VisitorCatalogue

[`src/components/VisitorCatalogue/VisitorCatalogue.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/VisitorCatalogue/VisitorCatalogue.jsx) handles:

- fetching catalogue data
- loading state
- error state
- empty state
- search input
- origin filter
- SHU range filters
- filter reset

It uses a debounced fetch and hardcodes `API_BASE_URL = "http://127.0.0.1:8000"`.

### Auth

[`src/pages/Auth.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/pages/Auth.jsx) is currently local-state only:

- no backend auth call
- login just logs to the console
- signup just logs to the console and navigates by selected role

## Backend Contract

Relevant backend files:

- [`Backend/main.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/main.py)
- [`Backend/app/routes/chilli.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/app/routes/chilli.py)
- [`Backend/app/routes/product.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/app/routes/product.py)
- [`Backend/app/services/product_services.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/app/services/product_services.py)

Current routes:

- `GET /chillies`
- `GET /chillies/search?q=...`
- `POST /chillies`
- `GET /inventory`
- `POST /inventory/add`

`GET /chillies` also supports:

- `shu_min`
- `shu_max`
- `origin`

The API returns chilli objects with fields such as:

- `id`
- `name`
- `description`
- `image_url`
- `shu_min`
- `shu_max`
- `origin`
- `color`
- `is_available`
- `stock_quantity`
- `season`

The inventory API returns objects with:

- `id`
- `name`
- `description`
- `quantity`
- `last_updated`
- `restock_date`
- `price`
- `image_url`

Inventory image URLs are built from an image stem such as `hot_sour` and stored under `../product_images/` with either `.jpg` or `.jpeg`.

Database helpers:

- [`Backend/db/sql/create_inventory_table.sql`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/sql/create_inventory_table.sql)
- [`Backend/db/scripts/create_inventory_table.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/scripts/create_inventory_table.py)
- [`Backend/db/scripts/load_peppers.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/db/scripts/load_peppers.py)

## Current Risks And Mismatches

- The frontend catalogue requests `/chillies/filter`, but that route does not exist in FastAPI
- The auth page navigates to `/visitor`, but there is no `/visitor` route in the router
- `VisitorMain.jsx` imports `../styles/visitorMain.css`, but the actual file name is `VisitorMain.css`
- `src/styles/VisitorMain.css` appears to be legacy CSS from an older page architecture
- The frontend does not yet use the inventory API

## Working Style For Future Changes

- Treat the visitor page as the primary product surface
- Preserve the existing component-based React structure
- Prefer editing existing component CSS rather than reintroducing inline styling
- Keep user-facing states explicit: loading, success, empty, error
- If you change routes, filenames, or backend endpoints, update the markdown files too

## Useful Run Commands

Frontend from repo root:

```bash
npm install
npm run dev
```

Backend from `Backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn psycopg2-binary python-dotenv pydantic
uvicorn main:app --reload
```

Database scripts from repo root:

```bash
python3 Backend/db/scripts/create_inventory_table.py
python3 Backend/db/scripts/load_peppers.py
```
