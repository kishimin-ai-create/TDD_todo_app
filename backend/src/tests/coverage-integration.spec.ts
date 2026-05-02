import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  scripts?: Record<string, string>
};

const backendRoot = join(__dirname, '..', '..');
const projectRoot = join(backendRoot, '..');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

describe('backend coverage reporting configuration', () => {
  it('defines backend coverage scripts', () => {
    const packageJson = readJson<PackageJson>(join(backendRoot, 'package.json'));

    expect(packageJson.scripts?.coverage).toBe('npm run coverage:unit && npm run coverage:integration');
    expect(packageJson.scripts?.['coverage:unit']).toBe('vitest run --coverage --config vitest.unit.config.ts');
    expect(packageJson.scripts?.['coverage:integration']).toBe('vitest run --coverage --config vitest.integration.config.ts');
  });

  it('configures unit coverage output and thresholds', () => {
    const config = readFileSync(join(backendRoot, 'vitest.unit.config.ts'), 'utf-8');

    expect(config).toContain("reportsDirectory: './coverage/unit'");
    expect(config).toMatch(/thresholds:\s*{[\s\S]*lines:\s*80/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*branches:\s*75/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*functions:\s*80/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*statements:\s*80/);
  });

  it('configures integration coverage output and thresholds', () => {
    const config = readFileSync(join(backendRoot, 'vitest.integration.config.ts'), 'utf-8');

    expect(config).toContain("reportsDirectory: './coverage/integration'");
    expect(config).toMatch(/thresholds:\s*{[\s\S]*lines:\s*80/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*branches:\s*75/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*functions:\s*80/);
    expect(config).toMatch(/thresholds:\s*{[\s\S]*statements:\s*80/);
  });

  it('keeps root coverage dashboard support wired', () => {
    const packageJson = readJson<PackageJson>(join(projectRoot, 'package.json'));
    const scriptPath = join(projectRoot, 'scripts', 'generate-coverage-report.js');

    expect(packageJson.scripts?.['coverage:backend']).toBe('cd backend && npm run coverage');
    expect(packageJson.scripts?.['coverage:report']).toBe('node scripts/generate-coverage-report.js');
    expect(existsSync(scriptPath)).toBe(true);
    expect(readFileSync(scriptPath, 'utf-8')).toContain("docs', 'coverage");
  });
});
