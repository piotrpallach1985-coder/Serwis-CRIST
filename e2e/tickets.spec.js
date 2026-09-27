import { test, expect } from '@playwright/test';

test.describe('Zgloszenie awarii', () => {
  test('Operator moze zglosic nowa awarie recznie', async ({ page }) => {
    await page.goto('/');
    await page.locator('button.bg-yellow-500').click();
    await page.locator('.ph-keyboard').click();
    
    // Maszyna
    await page.locator('input[placeholder*="maszyn"]').fill('Maszyna Testowa E2E');
    
    // Temat
    await page.locator('select').nth(1).selectOption('manual');
    await page.locator('input[placeholder*="temat"], input[placeholder*="awarii"]').fill('Testowy blad systemu');
    
    // Opis
    await page.locator('textarea').fill('Opis awarii wygenerowany automatycznie przez test E2E.');
    
    // Zglaszajacy
    await page.locator('input[list="reporters-list"]').fill('Automatyczny Tester E2E');
    
    // Telefon (wymagany!)
    await page.locator('input[type="tel"]').fill('500600700');
    
    // Zgoda RODO
    await page.locator('input[type="checkbox"]').last().check();

    // Submit
    await page.locator('button[type="submit"]').click();
    
    // Oczekuj na sukces
    await expect(page.locator('.ph-check-circle')).toBeVisible({ timeout: 15000 });
  });
});
