import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'TWOJ_EMAIL_ADMINA@crist.pl';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'TWOJE_HASLO';

test.describe('Panel Managera - Zmiana statusu zgloszenia', () => {
  test('Manager loguje sie i zmienia status pierwszego zgloszenia', async ({ page }) => {
    // 1. Wejdz na strone glowna (Login)
    await page.goto('/');

    // 2. Kliknij w przycisk "Zaloguj sie" w sekcji "Utrzymanie Ruchu"
    await page.locator('button.bg-blue-600').click();

    // 3. Zaloguj sie
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 4. Czekamy na przeladowanie do HomeDashboard (ikona kola zebatego)
    await expect(page.locator('.ph-gear').first()).toBeVisible({ timeout: 15000 });
    
    // Kliknij kafelek "Panel UR", ktory zaprowadzi nas do modulu UR
    await page.locator('button:has(.ph-wrench)').click();

    // 5. Teraz musimy przejsc z Mapy do listy Zgloszen (w bocznym menu)
    await page.locator('button:has(.ph-list-dashes), a:has(.ph-list-dashes), div.group:has(.ph-list-dashes), button:has-text("Zg")').first().click();

    // 6. Oczekaj na zaladowanie listy awarii (tabela biletow z ikona kolumn)
    await expect(page.locator('button:has(.ph-columns)')).toBeVisible({ timeout: 15000 });
    
    // 7. Znajdz i kliknij pierwsze zgloszenie na liscie
    await page.locator('button:has(.ph-caret-right)').first().click();

    // 8. Zweryfikuj, ze otworzyl sie modal szczegolow (textarea "Opcjonalnie dodaj...")
    await expect(page.locator('textarea[placeholder*="Opcjonalnie dodaj"]')).toBeVisible({ timeout: 10000 });
    
    // 9. Jesli zg�oszenie jest na etapie wyboru wykonawcy, musimy go wybrac zanim klikniemy przycisk
    const selectWykonawca = page.locator('select').first();
    if (await selectWykonawca.isVisible()) {
      // Wybieramy druga opcje (index 1), bo pierwsza (index 0) to "-- Kto sie tym zajmie? --"
      await selectWykonawca.selectOption({ index: 1 });
    }

    // 10. Zmien status na nastepny (zielony przycisk)
    const progressBtn = page.locator('button.bg-green-600').first();
    if (await progressBtn.isVisible()) {
      await expect(progressBtn).toBeEnabled({ timeout: 5000 });
      await progressBtn.click();
      
      // Sprawdz czy pojawil sie toast
      await expect(page.locator('.ph-check-circle').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
