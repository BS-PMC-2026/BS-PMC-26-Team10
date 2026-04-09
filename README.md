# ChiliLand

ChiliLand is a React + Vite frontend with a FastAPI backend for browsing chilli peppers and managing inventory products.

## Current App Status

The frontend currently includes:

- A visitor landing page at `/`
- A staff login and signup screen at `/staffLogin`
- Placeholder pages for `/owner` and `/tourguide`

The visitor page is the most complete part of the UI. It is assembled from reusable React components and connects to the backend catalogue API.

## Frontend Stack

- React 19
- Vite 8
- React Router 7
- Plain CSS modules by feature folder

## Frontend Structure

```text
src/
  App.jsx
  main.jsx
  assets/
  components/
    FooterVisitor/
    HeaderVisitor/
    VisitorCatalogue/
    WelcomeStrip/
  pages/
    Auth.jsx
    OwnerMain.jsx
    TourguideMain.jsx
    VisitorMain.jsx
  styles/
    auth.css
    VisitorMain.css
```

## Routes

- `/` -> visitor homepage
- `/staffLogin` -> login/signup screen
- `/owner` -> owner placeholder
- `/tourguide` -> tour guide placeholder

## Running The Frontend

From the repository root:

```bash
npm install
npm run dev
```

The Vite app runs on the local address shown in the terminal, typically `http://localhost:5173`.

## Running The FastAPI Backend

From the `Backend` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn psycopg2-binary python-dotenv pydantic
uvicorn main:app --reload
```

The API is expected at `http://127.0.0.1:8000`.

## Database Scripts

Reusable database files now live under `Backend/db/`:

```text
Backend/db/
  scripts/
    create_inventory_table.py
    load_peppers.py
  sql/
    create_inventory_table.sql
```

Useful commands from the repo root:

```bash
python3 Backend/db/scripts/create_inventory_table.py
python3 Backend/db/scripts/load_peppers.py
```

`create_inventory_table.py` drops and recreates `inventory`.
`load_peppers.py` drops and recreates `chilli`, then reloads it from `pepper_list.xlsx`.

## Backend Expectations

The backend reads database settings from [`.env`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/.env) and expects a local PostgreSQL instance:

- host: `localhost`
- database: `postgres`
- user: `postgres`
- port: value from `DB_PORT`
- password: value from `DB_PASSWORD`

## Visitor Experience

The visitor homepage is composed of:

- A responsive video hero with desktop and mobile background videos
- A marketing strip describing tours, products, and family visits
- A chilli catalogue with search and filter controls
- A footer with placeholder navigation and contact details

## API Notes

Frontend catalogue code currently uses `http://127.0.0.1:8000` directly.

The current backend endpoints in the codebase are:

- `GET /chillies`
- `GET /chillies?shu_min=...&shu_max=...&origin=...`
- `GET /chillies/search?q=...`
- `POST /chillies`
- `GET /inventory`
- `POST /inventory/add`

There is a current integration mismatch: [`src/components/VisitorCatalogue/VisitorCatalogue.jsx`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/components/VisitorCatalogue/VisitorCatalogue.jsx) requests `/chillies/filter`, but the FastAPI router in [`Backend/app/routes/chilli.py`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend/app/routes/chilli.py) does not define that route.

The backend also serves static files from:

- `/chilli_images`
- `/product_images`

## Known Gaps

- Owner and tour guide pages are placeholders only
- Auth is client-side only and does not call the backend
- The auth page navigates to `/visitor`, but the router only defines `/`
- `src/pages/VisitorMain.jsx` imports `../styles/visitorMain.css` while the file on disk is [`src/styles/VisitorMain.css`](/Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/src/styles/VisitorMain.css)
- There is no frontend inventory screen yet, even though the backend now exposes inventory routes
