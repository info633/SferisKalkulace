import { test, expect } from '@playwright/test'

test('wizard shows preview and allows submit', async ({ page }) => {
  await page.goto('/wizard')
  await expect(page.getByRole('heading', { name: /Nová kalkulace/i })).toBeVisible()

  // Fill some values
  await page.getByLabel('Jméno').fill('Jan')
  await page.getByLabel('Příjmení').fill('Novák')
  // If these labels differ, adjust accordingly:
  const facade = page.getByLabel(/Zateplení obvodových stěn/i)
  if (await facade.count()) await facade.fill('120')

  // Table preview appears
  await expect(page.locator('table')).toBeVisible()

  // Create offer (may rely on local fallback)
  await page.getByRole('button', { name: /Vytvořit nabídku/i }).click()
})
