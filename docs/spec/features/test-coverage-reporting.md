# Test Coverage Reporting Workflow

**Status:** Specification  
**Version:** 1.0  
**Last Updated:** 2024  

---

## 1. Feature Summary

This feature implements an automated test coverage reporting workflow for both frontend (React + Vitest) and backend (Hono + Vitest) services. The system generates HTML coverage reports, enforces minimum coverage thresholds, and provides accessible coverage dashboards through the repository documentation.

### Key Objectives
- Generate HTML coverage reports for frontend and backend with line, branch, function, and statement metrics
- Display coverage percentages across both layers
- Enforce minimum coverage thresholds in CI/CD pipeline
- Provide accessible coverage dashboard via `docs/coverage/index.html`
- Enable trend tracking through coverage snapshots
- Display coverage badges in README.md for visibility

---

## 2. Requirements

### 2.1 Frontend Coverage

#### Coverage Execution
- Command: `npm run coverage` (primary) or `npm run coverage:frontend` (specific)
- Test runner: Vitest with coverage provider (C8/V8)
- Report location: `frontend/coverage/`

#### Metrics & Thresholds
- **Measured Metrics:**
  - Line coverage
  - Branch coverage
  - Function coverage
  - Statement coverage
- **Threshold Targets:**
  - Overall: 80% minimum
  - Branch: 75% minimum
  - Function: 80% minimum
  - Statement: 80% minimum

#### Output Formats
- **HTML Report** (primary): Interactive coverage viewer with source code highlighting
- **JSON Report** (secondary): Machine-parseable format for CI/CD integration
- **LCOV Format** (optional): For third-party coverage tools

#### Configuration
- Exclude: `node_modules`, `dist`, `coverage`, `*.config.ts`
- Report style: HTML with source tree navigation
- Store with git: Coverage reports committed or cached

---

### 2.2 Backend Coverage

#### Coverage Execution - Unit Tests
- Command: `npm run coverage:backend` or `npm run coverage:backend:unit`
- Config: `vitest.unit.config.ts`
- Report location: `backend/coverage/unit/`

#### Coverage Execution - Integration Tests
- Command: `npm run coverage:backend:integration` (optional separate run)
- Config: `vitest.integration.config.ts`
- Report location: `backend/coverage/integration/`

#### Metrics & Thresholds
- **Measured Metrics:**
  - Line coverage
  - Branch coverage
  - Function coverage
  - Statement coverage
- **Threshold Targets:**
  - Overall: 80% minimum
  - Branch: 75% minimum
  - Function: 80% minimum
  - Statement: 80% minimum

#### Output Formats
- **HTML Report** (primary): Interactive coverage viewer with source code highlighting
- **JSON Report** (secondary): Machine-parseable format for CI/CD integration
- **LCOV Format** (optional): For third-party coverage tools

#### Configuration
- Exclude: `node_modules`, `dist`, `coverage`, `*.config.ts`
- Separate tracking for unit vs. integration test coverage
- Report style: HTML with source tree navigation
- Store with git: Coverage reports committed or cached

---

### 2.3 Reporting & Accessibility

#### Central Coverage Dashboard
- **Location:** `docs/coverage/index.html`
- **Content:**
  - Summary table with coverage percentages by layer (frontend, backend)
  - Breakdown by test type (unit, integration for backend)
  - Links to detailed HTML reports
  - Last updated timestamp
  - Trend indicators (if available)

#### Coverage Summary Table Format
| Layer | Test Type | Line Coverage | Branch Coverage | Function Coverage | Statement Coverage |
|-------|-----------|----------------|-----------------|-------------------|-------------------|
| Frontend | Unit | xx% | xx% | xx% | xx% |
| Backend | Unit | xx% | xx% | xx% | xx% |
| Backend | Integration | xx% | xx% | xx% | xx% |
| **Overall** | **Combined** | **xx%** | **xx%** | **xx%** | **xx%** |

#### GitHub Actions Workflow
- **Trigger:** Pull requests, commits to main/develop
- **Matrix:** Parallel execution of frontend and backend coverage jobs
- **Outputs:**
  - Coverage reports uploaded as artifacts
  - Pass/fail based on threshold violations
  - Coverage badge data generated
  - Workflow summary posted to PR (optional)

#### README.md Coverage Badges
- **Format:** Shield.io badges or similar service
- **Display:**
  - Frontend overall coverage
  - Backend overall coverage
  - Link to full coverage dashboard
  - **Example:**
    ```
    [![Frontend Coverage](https://img.shields.io/badge/frontend%20coverage-85%25-brightgreen)]()
    [![Backend Coverage](https://img.shields.io/badge/backend%20coverage-82%25-brightgreen)]()
    ```

#### Archive & Trend Tracking
- Coverage snapshots saved with date/commit hash
- Directory structure: `docs/coverage/history/{date}/`
- Enables coverage trend analysis over time
- Optional: Display trend charts in dashboard

---

## 3. Acceptance Criteria

- [ ] **Frontend Coverage Command**
  - `npm run coverage` generates HTML report in `frontend/coverage/`
  - Report is valid HTML, displayable in browser
  - All coverage metrics collected: line, branch, function, statement

- [ ] **Backend Coverage Command**
  - `npm run coverage:backend` generates HTML report in `backend/coverage/unit/`
  - Report is valid HTML, displayable in browser
  - All coverage metrics collected: line, branch, function, statement
  - Integration tests can be separately executed with `npm run coverage:backend:integration`

- [ ] **Coverage Thresholds Enforced**
  - Frontend: Fails if line < 80% or branch < 75%
  - Backend: Fails if line < 80% or branch < 75%
  - CI job fails when thresholds violated
  - Clear error messages indicate which metric failed and by how much

- [ ] **GitHub Actions Workflow**
  - `.github/workflows/test-coverage.yml` exists and is executable
  - Workflow runs on PR creation/update
  - Frontend and backend coverage run in parallel
  - Workflow passes when both layers meet thresholds
  - Workflow fails when any layer misses thresholds
  - Coverage reports uploaded as workflow artifacts

- [ ] **Central Coverage Dashboard**
  - `docs/coverage/index.html` exists and is valid HTML
  - Displays summary table with all metrics
  - Links to frontend and backend detailed reports work correctly
  - Shows last updated timestamp
  - Accessible without running build process

- [ ] **README.md Coverage Badges**
  - Coverage badges display in README.md
  - Badges reflect current coverage percentages
  - Badges link to full coverage dashboard
  - Badges update automatically with CI workflow

- [ ] **CI Pass/Fail Logic**
  - CI passes when all coverage thresholds met
  - CI fails when any threshold violated
  - PR cannot merge if coverage thresholds failed
  - Failed threshold violations are clearly reported in PR checks

- [ ] **Coverage Report Persistence**
  - Coverage reports committed to repository OR cached appropriately
  - Reports accessible without re-running tests
  - History tracked for trend analysis (optional but recommended)

- [ ] **Backward Compatibility**
  - Existing `npm test` command unaffected
  - Existing test execution time not degraded
  - Coverage generation is optional (doesn't run by default)

---

## 4. Implementation Scope

### 4.1 Package.json Scripts

#### Root package.json
```json
{
  "scripts": {
    "coverage": "npm run coverage:frontend && npm run coverage:backend",
    "coverage:frontend": "cd frontend && npm run coverage",
    "coverage:backend": "cd backend && npm run coverage",
    "coverage:report": "node scripts/generate-coverage-report.js"
  }
}
```

#### Frontend package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "coverage": "vitest run --coverage --reporter=html --reporter=json"
  }
}
```

#### Backend package.json
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:unit": "vitest --run --config vitest.unit.config.ts",
    "test:integration": "vitest --run --config vitest.integration.config.ts",
    "coverage": "npm run coverage:unit && npm run coverage:integration",
    "coverage:unit": "vitest --run --coverage --config vitest.unit.config.ts",
    "coverage:integration": "vitest --run --coverage --config vitest.integration.config.ts"
  }
}
```

### 4.2 Files to Create/Modify

#### New Files
1. **`.github/workflows/test-coverage.yml`**
   - GitHub Actions workflow for automated coverage reporting
   - Runs on PR, push to main/develop
   - Matrix job for parallel frontend/backend execution
   - Uploads coverage artifacts
   - Generates coverage badges

2. **`docs/coverage/index.html`**
   - Central coverage dashboard
   - Summary table of all metrics
   - Links to detailed reports
   - Last updated info
   - Optional trend visualization

3. **`scripts/generate-coverage-report.js`**
   - Node.js script to aggregate coverage data
   - Parse JSON coverage outputs
   - Generate summary table HTML
   - Update README.md badges
   - Archive historical data

4. **`frontend/vitest.config.ts` (coverage config)**
   - Coverage provider configuration
   - Threshold definitions
   - Reporter setup (HTML, JSON)
   - Include/exclude patterns

5. **`backend/vitest.unit.config.ts` (coverage config)**
   - Coverage provider configuration
   - Threshold definitions
   - Reporter setup (HTML, JSON)
   - Include/exclude patterns

6. **`backend/vitest.integration.config.ts` (coverage config)**
   - Coverage provider configuration
   - Threshold definitions
   - Reporter setup (HTML, JSON)
   - Include/exclude patterns

#### Modified Files
1. **`frontend/package.json`**
   - Add/update coverage scripts
   - Add coverage dependencies if needed (c8, @vitest/coverage-v8)

2. **`backend/package.json`**
   - Add/update coverage scripts
   - Add coverage dependencies if needed (c8, @vitest/coverage-v8)

3. **`README.md`**
   - Add coverage badge section
   - Link to coverage dashboard
   - Document how to run coverage locally

---

## 5. Technical Details

### 5.1 Coverage Provider
- **Primary:** Vitest native coverage with V8/C8
- **Alternative:** @vitest/coverage-v8 or @vitest/coverage-c8
- **Rationale:** Native vitest integration, no external dependencies, fast execution

### 5.2 Report Generation
- **HTML Reports:** Generated by vitest coverage provider
  - Source code highlighting
  - Tree navigation for files
  - Branch/line toggles
  - Percentage breakdowns

- **JSON Reports:** Machine-readable format
  - Parse coverage metrics programmatically
  - Generate badges from percentages
  - Archive for trend analysis

### 5.3 Badge Generation
- **Tool:** shield.io API or static badge generation
- **Format:** SVG badges for README.md
- **Update Frequency:** On every successful coverage run
- **Badge URL Pattern:**
  ```
  https://img.shields.io/badge/{layer}%20coverage-{percentage}%25-{color}
  ```

### 5.4 Threshold Enforcement
- **Vitest Configuration:**
  ```javascript
  coverage: {
    provider: 'v8',
    lines: 80,
    branches: 75,
    functions: 80,
    statements: 80,
    all: true
  }
  ```
- **CI Validation:** GitHub Actions job fails if thresholds not met
- **Error Messages:** Detailed output showing which metrics failed

### 5.5 Report Structure
```
frontend/coverage/
├── index.html          # Main report
├── coverage-final.json # Final coverage metrics
├── coverage.json       # Detailed coverage data
└── (source files)/     # Coverage by file

backend/coverage/unit/
├── index.html
├── coverage-final.json
└── (source files)/

backend/coverage/integration/
├── index.html
├── coverage-final.json
└── (source files)/

docs/coverage/
├── index.html          # Central dashboard
├── history/            # (Optional) Historical snapshots
│   ├── 2024-01-15/
│   ├── 2024-01-16/
│   └── ...
└── badges/             # (Optional) Badge SVGs
```

---

## 6. Non-Functional Requirements

### Performance
- **Coverage Generation Time:** < 60 seconds for full suite
- **Report Load Time:** HTML reports load in browser < 2 seconds
- **Memory Usage:** Coverage process should not exceed 1GB RAM

### Accessibility
- **HTML Reports:** WCAG 2.1 AA compliant (standard vitest reporter)
- **Dashboard:** Accessible without running build process
- **Badge Display:** Works on all markdown renderers (GitHub, GitLab, etc.)

### Compatibility
- **Node.js:** Compatible with versions specified in project (14+)
- **Operating Systems:** Works on Windows, macOS, Linux
- **Browsers:** Chrome, Firefox, Safari, Edge (for viewing HTML reports)

### Reliability
- **Idempotency:** Running coverage multiple times produces same results
- **Failure Handling:** Clear error messages when coverage fails
- **CI/CD Integration:** Works with GitHub Actions without custom runners

### Maintainability
- **Configuration:** Single source of truth for thresholds
- **Documentation:** Clear instructions for running coverage locally
- **Extensibility:** Easy to add new layers (e.g., backend v2) to dashboard
- **Version Control:** Coverage configs tracked in git

### Security
- **Report Contents:** No sensitive data in coverage reports
- **Artifact Storage:** Coverage artifacts stored securely in GitHub
- **Permissions:** Workflow limited to repository scope

---

## 7. Success Metrics

### Quantitative
- Coverage reports generated successfully 100% of PRs
- Threshold violations caught and reported in 100% of relevant PRs
- Coverage generation completes in < 60 seconds
- HTML reports load without errors in all supported browsers

### Qualitative
- Team finds coverage dashboard useful and accessible
- Coverage badges increase code quality awareness
- Developers understand coverage gaps from reports
- CI failures due to coverage are clear and actionable

---

## 8. Future Enhancements (Out of Scope)

- Coverage trend charts and analysis over time
- Diff-based coverage reporting (coverage changes per PR)
- Codecov/Coveralls integration for third-party tracking
- Coverage gates (e.g., block merge if coverage dropped)
- Per-component coverage reporting (for frontend)
- Custom coverage reports per team/module

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Line Coverage** | Percentage of executable lines executed by tests |
| **Branch Coverage** | Percentage of conditional branches taken during tests |
| **Function Coverage** | Percentage of functions called during tests |
| **Statement Coverage** | Percentage of statements executed during tests |
| **Threshold** | Minimum acceptable coverage percentage |
| **Artifact** | File/output generated by CI workflow, stored temporarily |
| **Report** | HTML/JSON document containing coverage metrics and source details |

---

## 10. Related Documents

- [Vitest Documentation](https://vitest.dev/)
- [C8 Coverage Provider](https://github.com/bcoe/c8)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Backend Vitest Configuration: `backend/vitest.unit.config.ts`
- Frontend Vitest Configuration: `frontend/vite.config.ts`
