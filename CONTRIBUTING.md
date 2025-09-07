# Contributing – Sferis Kalkulace

## Branching
- `main` – produkce (chráněná větev)
- `dev` – integrační prostředí
- feature větve: `feat/<název>`, bugfix: `fix/<název>`

## PR pravidla
- Každá změna přes PR do `dev`
- Zelená CI (typecheck, lint, test, build)
- Min. 1 review (CODEOWNERS)
- Semver commit zprávy (feat:, fix:, chore:)

## Lokální běh
```
npm i
npm run dev
```

## Skripty
Doplňte do package.json:
```
"typecheck": "tsc --noEmit",
"lint": "eslint . --ext .ts,.tsx",
"test": "vitest run"
```

## Testy
- Unit testy: `npm test`
- E2E (Playwright): `npx playwright test`

## Env
- `.env.example` udržujte aktuální
- V CI nepoužívejte tajemství v plain textu – Secret Manager / GitHub Secrets
