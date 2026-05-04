import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

type PackageJson = {
  scripts?: Record<string, string>
}

const frontendRoot = join(__dirname, '..', '..')
const projectRoot = join(frontendRoot, '..')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

describe('coverage reporting configuration', () => {
  it('defines frontend coverage scripts', () => {
    const packageJson = readJson<PackageJson>(join(frontendRoot, 'package.json'))

    expect(packageJson.scripts?.coverage).toBe('vitest run --coverage')
    expect(packageJson.scripts?.['coverage:frontend']).toBe('vitest run --coverage')
  })

  it('configures frontend coverage output', () => {
    const config = readFileSync(join(frontendRoot, 'vite.config.ts'), 'utf-8')

    expect(config).toContain("reporter: ['html', 'json']")
    expect(config).toContain("reportsDirectory: './coverage'")
  })

  it('defines root coverage aggregation scripts', () => {
    const packageJson = readJson<PackageJson>(join(projectRoot, 'package.json'))

    expect(packageJson.scripts?.coverage).toBeDefined()
    expect(packageJson.scripts?.['coverage:frontend']).toBeDefined()
    expect(packageJson.scripts?.['coverage:backend']).toBeDefined()
    expect(packageJson.scripts?.['coverage:report']).toBe('node scripts/generate-coverage-report.js')
  })

  it('provides the combined coverage dashboard generator', () => {
    const scriptPath = join(projectRoot, 'scripts', 'generate-coverage-report.js')

    expect(existsSync(scriptPath)).toBe(true)
    expect(readFileSync(scriptPath, 'utf-8')).toContain("docs', 'coverage")
  })
})
