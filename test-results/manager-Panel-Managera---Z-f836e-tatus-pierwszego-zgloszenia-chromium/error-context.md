# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manager.spec.js >> Panel Managera - Zmiana statusu zgloszenia >> Manager loguje sie i zmienia status pierwszego zgloszenia
- Location: e2e\manager.spec.js:7:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has(.ph-wrench)')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "App Logo" [ref=e7]
    - heading "MAINTENANCE SYSTEM" [level=1] [ref=e8]
  - generic [ref=e9]:
    - generic [ref=e10] [cursor=pointer]:
      - generic [ref=e11]: 
      - heading "Zgłoszenie Awarii" [level=2] [ref=e13]
      - paragraph [ref=e14]: Dla pracowników. Zgłoszenia bezpośrednio ze stanowiska, bez logowania.
      - button "Zgłoś awarię " [ref=e15]:
        - text: Zgłoś awarię
        - generic [ref=e16]: 
    - generic [ref=e17] [cursor=pointer]:
      - generic [ref=e18]: 
      - heading "Utrzymanie Ruchu" [level=2] [ref=e20]
      - paragraph [ref=e21]: Dostęp dla autoryzowanych pracowników działu Utrzymania Ruchu.
      - button "Zaloguj się " [ref=e22]:
        - text: Zaloguj się
        - generic [ref=e23]: 
  - generic [ref=e25]:
    - button "" [ref=e26] [cursor=pointer]
    - generic [ref=e28]:
      - generic [ref=e29]: 
      - heading "Logowanie" [level=2] [ref=e31]
      - paragraph [ref=e32]: Dostęp wymaga autoryzacji do wybranego modułu.
    - generic [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e35]: Adres e-mail
        - textbox "twój.email@crist.pl" [ref=e36]: piotr.pallach@crist.com.pl
      - generic [ref=e37]:
        - generic [ref=e38]: Hasło
        - textbox "••••••••" [ref=e39]: "!@#PioTR"
      - generic [ref=e40]: Nieprawidłowy e-mail lub hasło.
      - button "Zaloguj się i przejdź" [ref=e41] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'TWOJ_EMAIL_ADMINA@crist.pl';
  4  | const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'TWOJE_HASLO';
  5  | 
  6  | test.describe('Panel Managera - Zmiana statusu zgloszenia', () => {
  7  |   test('Manager loguje sie i zmienia status pierwszego zgloszenia', async ({ page }) => {
  8  |     // 1. Wejdz na strone glowna (Login)
  9  |     await page.goto('/');
  10 | 
  11 |     // 2. Kliknij w przycisk "Zaloguj sie" w sekcji "Utrzymanie Ruchu"
  12 |     await page.locator('button.bg-blue-600').click();
  13 | 
  14 |     // 3. Zaloguj sie
  15 |     await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  16 |     await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  17 |     await page.locator('button[type="submit"]').click();
  18 | 
  19 |     // 4. Czekamy na przeladowanie do HomeDashboard (ikona kola zebatego)
  20 |     await expect(page.locator('.ph-gear').first()).toBeVisible({ timeout: 15000 });
  21 |     
  22 |     // Kliknij kafelek "Panel UR", ktory zaprowadzi nas do modulu UR
> 23 |     await page.locator('button:has(.ph-wrench)').click();
     |                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  24 | 
  25 |     // 5. Teraz musimy przejsc z Mapy do listy Zgloszen (w bocznym menu)
  26 |     await page.locator('button:has(.ph-list-dashes), a:has(.ph-list-dashes), div.group:has(.ph-list-dashes), button:has-text("Zg")').first().click();
  27 | 
  28 |     // 6. Oczekaj na zaladowanie listy awarii (tabela biletow z ikona kolumn)
  29 |     await expect(page.locator('button:has(.ph-columns)')).toBeVisible({ timeout: 15000 });
  30 |     
  31 |     // 7. Znajdz i kliknij pierwsze zgloszenie na liscie
  32 |     await page.locator('button:has(.ph-caret-right)').first().click();
  33 | 
  34 |     // 8. Zweryfikuj, ze otworzyl sie modal szczegolow (textarea "Opcjonalnie dodaj...")
  35 |     await expect(page.locator('textarea[placeholder*="Opcjonalnie dodaj"]')).toBeVisible({ timeout: 10000 });
  36 |     
  37 |     // 9. Jesli zg�oszenie jest na etapie wyboru wykonawcy, musimy go wybrac zanim klikniemy przycisk
  38 |     const selectWykonawca = page.locator('select').first();
  39 |     if (await selectWykonawca.isVisible()) {
  40 |       // Wybieramy druga opcje (index 1), bo pierwsza (index 0) to "-- Kto sie tym zajmie? --"
  41 |       await selectWykonawca.selectOption({ index: 1 });
  42 |     }
  43 | 
  44 |     // 10. Zmien status na nastepny (zielony przycisk)
  45 |     const progressBtn = page.locator('button.bg-green-600').first();
  46 |     if (await progressBtn.isVisible()) {
  47 |       await expect(progressBtn).toBeEnabled({ timeout: 5000 });
  48 |       await progressBtn.click();
  49 |       
  50 |       // Sprawdz czy pojawil sie toast
  51 |       await expect(page.locator('.ph-check-circle').first()).toBeVisible({ timeout: 5000 });
  52 |     }
  53 |   });
  54 | });
  55 | 
```