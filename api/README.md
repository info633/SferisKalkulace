# SFERIS Kalkulátor PRO v2 — API (MVP)

**Co umí:** ověření Firebase tokenu, uložení kalkulací, seznam/čtení/úprava/smazání kalkulací,
správa (MVP) ceníků/skladeb a export kalkulace na Make webhook.

## Lokální spuštění

1) **Node.js 18+** a **Google Cloud SDK** (kvůli přihlášení ADC)  
   ```bash
   gcloud auth application-default login
   ```

2) **Firestore (Native mode)** musí být aktivní v GCP projektu.  
   Pokud chcete lokální emulátor: nastavte `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` a spusťte emulátor samostatně.

3) **Instalace**  
   ```bash
   cd api
   npm install
   npm run seed           # volitelné – vytvoří výchozí pricebook
   npm run dev
   ```

4) **Proměnné**  
   - `CORS_ORIGIN`: např. `http://localhost:5500` (pokud pouštíte index.html přes Live Server)  
   - `SFERIS_ADMINS`: e-maily adminů, např. `martin.fiser@sferis.cz`  
   - `MAKE_WEBHOOK_URL`: webhook do vašeho scénáře v Make (volitelné)

> Admin SDK používá **Application Default Credentials**. Lokálně se přihlašte `gcloud auth application-default login`. Na Cloud Run se použije výchozí služební účet.

## Endpoints (zkratka)

- `GET /health` — stav
- `GET /v1/me` — info o uživateli (role z e-mailu v seznamu adminů)
- `POST /v1/calculations` — uloží kalkulaci `{ pricebookId, schemeId, measures, totals, energy, meta }`
- `GET /v1/calculations?mine=1` — moje kalkulace
- `GET /v1/calculations/:id` · `PUT` · `DELETE`
- `GET /v1/pricebooks` — seznam (MVP)
- `POST /v1/pricebooks` — založení (admin)
- `GET/POST /v1/pricebooks/:id/items` — položky (admin POST)
- `GET/POST /v1/pricebooks/:id/compositions` — skladby (admin POST)
- `POST /v1/export/make/:id` — odeslání kalkulace na Make webhook

## Nasazení na Cloud Run (zkratka)

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/sferis-api:v0
gcloud run deploy sferis-api --image gcr.io/PROJECT_ID/sferis-api:v0 --platform managed --region europe-central2 --allow-unauthenticated
gcloud run services update sferis-api     --update-env-vars CORS_ORIGIN=https://YOUR_FRONTEND,SFERIS_ADMINS=martin.fiser@sferis.cz,MAKE_WEBHOOK_URL=https://hook.make.com/... 
```

> Doporučeno omezit přístup jen na přihlášené klienty: v produkci **nepovolujte** „unauthenticated“ a zavřete službu jen pro FE doménu, která vždy posílá Bearer token.
