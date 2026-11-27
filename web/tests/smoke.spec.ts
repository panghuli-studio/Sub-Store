import {test,expect} from '@playwright/test';
test('application document loads without changing host networking',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/Sub-Store/)});
