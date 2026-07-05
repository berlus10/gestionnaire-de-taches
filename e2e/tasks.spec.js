import { test, expect } from '@playwright/test';

test.describe('Parcours utilisateur - gestion des tâches', () => {
  test('un utilisateur crée une tâche et la voit apparaître dans la liste', async ({ page }) => {
    await page.goto('/');

    // Aucune tâche au départ
    await expect(page.getByTestId('task-item')).toHaveCount(0);

    // Remplir et soumettre le formulaire
    await page.locator('#title').fill('Préparer la soutenance QA');
    await page.locator('#priority').selectOption('haute');
    await page.locator('#dueDate').fill('2026-08-15');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // La tâche doit apparaître dans la liste, avec les bonnes informations
    const taskItems = page.getByTestId('task-item');
    await expect(taskItems).toHaveCount(1);
    await expect(taskItems.first()).toContainText('Préparer la soutenance QA');
    await expect(taskItems.first()).toContainText('haute');
  });

  test('un utilisateur voit un message d\'erreur si le titre est vide', async ({ page }) => {
    await page.goto('/');

    // Le champ titre est "required" côté HTML, donc on contourne la validation
    // native pour vérifier la gestion d'erreur côté API/JS.
    await page.locator('#title').fill(' ');
    await page.locator('#dueDate').fill('2026-08-15');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('titre');
  });
});
