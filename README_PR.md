# PR Bootstrap for SferisKalkulace

## Kroky
1) Vytvoř větev `ci-boot` a zkopíruj sem obsah balíčku.
2) Doinstaluj dev závislosti:
```
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint eslint-plugin-react eslint-plugin-react-hooks prettier vitest @playwright/test
```
3) Do `package.json` přidej skripty:
```
"typecheck": "tsc --noEmit",
"lint": "eslint . --ext .ts,.tsx",
"test": "vitest run"
```
4) Otevři PR do `dev`. Po merge se spustí CI (typecheck, lint, test, build).
5) Nastav Protected Branches pro `dev` a `main` a CODEOWNERS.

## Playwright (E2E)
Lokálně spustíš:
```
npm run dev
npx playwright test
```

## Vitest (unit)
```
npm test
```
