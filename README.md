# ChilliLand

Full-stack web app for browsing chilli peppers, managing inventory, booking tours, and processing orders.

- **Frontend**: React 19 + Vite, served as a static site
- **Backend**: FastAPI (Python 3.11), served via Gunicorn + Uvicorn workers
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Azure App Service (two separate apps)

---

## Project Structure

```
BS-PMC-26-Team10/
  Frontend/          React + Vite app
    src/
    public/
    .env             Frontend env vars (Vite bakes these at build time)
    package.json
  Backend/           FastAPI app
    app/
      routes/        API route files (chilli, product, order, tour, booking, etc.)
    chilli_images/
    product_images/
    main.py          FastAPI app entry point
    requirements.txt
    .env             Backend env vars (loaded at runtime)
```

---

## Environment Variables

### Frontend — `Frontend/.env`

```
VITE_API_URL=https://chillieland-backend-fpdyfhethmhth7hb.southeastasia-01.azurewebsites.net
VITE_PAYPAL_CLIENT_ID=<your paypal client id>
```

> **Important:** Vite bakes these into the compiled JS at build time. If you change `.env`, you must run `npm run build` and redeploy the frontend.

### Backend — `Backend/.env`

```
SUPABASE_URL=https://urfqpdduwmonrhwmidcp.supabase.co
SUPABASE_KEY=<legacy eyJ... JWT service_role key from Supabase Settings > API > Legacy keys>
RESEND_API_KEY=<resend api key>
SENDER_EMAIL=onboarding@resend.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=chililand.team10@gmail.com
SMTP_APP_PASSWORD=<gmail app password>
SMTP_SENDER_EMAIL=chililand.team10@gmail.com
JWT_SECRET=<your jwt secret>
```

> **Important:** The `SUPABASE_KEY` must be the legacy JWT key (starts with `eyJ...`), NOT the new `sb_secret_` format — the Python supabase library does not support the new format yet. Find it at: Supabase Dashboard → Project Settings → API → Legacy API keys → `service_role`.

Backend env vars are runtime — you can update them in Azure App Settings without redeploying.

---

## Running Locally

### Backend

```bash
cd Backend
python3 -m venv backend
source backend/bin/activate        # Windows: backend\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Azure Infrastructure

| | Frontend | Backend |
|---|---|---|
| **App name** | `ChilliLand` | `Chillieland-backend` |
| **Resource group** | `bs-pm-2026-team10` | `bs-pm-2026-team10` |
| **URL** | https://chilliland-d6dsaxcha2bgc4fc.southeastasia-01.azurewebsites.net | https://chillieland-backend-fpdyfhethmhth7hb.southeastasia-01.azurewebsites.net |
| **Runtime** | Node 20 (LTS) | Python 3.11 |
| **Startup command** | `npx serve -s . -l 8080` | `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app` |

---

## Deploying / Redeploying

### Redeploy Backend

Run this whenever you change Python code, `requirements.txt`, or backend config.

```bash
cd /Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Backend && \
rm -f ../backend.zip && \
zip -r ../backend.zip . \
  --exclude "backend/*" \
  --exclude "__pycache__/*" \
  --exclude "*.pyc" \
  --exclude ".pytest_cache/*" \
  --exclude ".deployment" -q && \
az webapp deployment source config-zip \
  --resource-group bs-pm-2026-team10 \
  --name Chillieland-backend \
  --src ../backend.zip
```

This uses `config-zip` which triggers Azure Oryx build — it installs `requirements.txt` automatically on the server.

### Redeploy Frontend

Run this whenever you change React code or `Frontend/.env`.

```bash
cd /Users/normuradov/Documents/GitHub/BS-PMC-26-Team10/Frontend && \
npm run build && \
cd dist && \
zip -r ../dist.zip . && \
cd .. && \
az webapp deploy \
  --resource-group bs-pm-2026-team10 \
  --name ChilliLand \
  --src-path dist.zip \
  --type zip
```

> The zip must contain the **contents** of `dist/` at the root, not the `dist/` folder itself. The `cd dist && zip .` pattern ensures this.

---

## Updating Backend Environment Variables (No Redeploy Needed)

To update a single variable:

```bash
az webapp config appsettings set \
  --resource-group bs-pm-2026-team10 \
  --name Chillieland-backend \
  --settings KEY=VALUE
```

To view current settings:

```bash
az webapp config appsettings list \
  --resource-group bs-pm-2026-team10 \
  --name Chillieland-backend \
  --output table
```

---

## Checking Backend Logs

```bash
az webapp log tail \
  --resource-group bs-pm-2026-team10 \
  --name Chillieland-backend
```

Or open in browser: https://chillieland-backend-fpdyfhethmhth7hb.scm.southeastasia-01.azurewebsites.net/api/logs/docker

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chillies` | List all chilli peppers (supports filters) |
| GET | `/chillies/search?q=` | Search chillies by name |
| POST | `/chillies` | Add a chilli |
| GET | `/products` | List products |
| POST | `/products` | Add a product |
| GET | `/orders` | List orders |
| POST | `/orders` | Create an order |
| GET | `/tours` | List tours |
| POST | `/bookings` | Create a booking |
| GET | `/promos` | List promos |
| GET | `/faqs` | List FAQs |
| POST | `/admin/login` | Admin login (returns JWT) |

Static files served from:
- `/chilli_images/<filename>`
- `/product_images/<filename>`

---

## Known Issues

- **Admin login** uses a direct `psycopg2` PostgreSQL connection that currently tries to connect to `localhost:5432`. On Azure this fails. Fix: set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` as App Settings pointing to the Supabase PostgreSQL connection string (found in Supabase Dashboard → Project Settings → Database → Connection string).
- **PayPal** returns a 400 error because the Azure frontend domain is not whitelisted. Fix: go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) → Apps & Credentials → your app → add `https://chilliland-d6dsaxcha2bgc4fc.southeastasia-01.azurewebsites.net` to allowed return URLs.
- **CORS**: `allow_credentials=True` with `allow_origins=["*"]` is rejected by browsers. The backend already lists specific allowed origins in `main.py` — add any new frontend domain there and redeploy.
