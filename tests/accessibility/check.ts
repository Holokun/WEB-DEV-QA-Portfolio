import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

// Preserve every rule/result, including lower impacts and incomplete checks.
// The agreed release gate covers critical/serious findings, without exclusions.
export async function checkAccessibility(page: Page, info: TestInfo, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  await info.attach(`axe-${state}`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  const blocking = results.violations.filter(item => item.impact === 'critical' || item.impact === 'serious');
  expect(blocking, `${state}: critical/serious axe findings: ${blocking.map(item => item.id).join(', ')}`).toEqual([]);
}
