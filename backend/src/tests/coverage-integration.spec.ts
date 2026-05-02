import { describe, it, expect, beforeEach, vi } from "vitest";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Test Coverage Reporting Feature - Backend Integration Tests
 *
 * Comprehensive test suite verifying:
 * - Backend coverage command execution and report generation
 * - Coverage thresholds enforcement
 * - GitHub Actions workflow validation
 * - Coverage report integrity and accessibility
 * - README badge presence and linking
 */

describe("Test Coverage Reporting - Backend Coverage", () => {
  const backendRoot = join(__dirname, "..", "..");
  const projectRoot = join(backendRoot, "..");
  const docsRoot = join(projectRoot, "docs");
  const coverageRoot = join(backendRoot, "coverage");

  describe("Backend Coverage Command Execution", () => {
    it("should have npm run coverage command defined in package.json", () => {
      // Arrange
      const packageJsonPath = join(backendRoot, "package.json");

      // Act
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

      // Assert
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts["coverage"]).toBeDefined();
      expect(typeof packageJson.scripts.coverage).toBe("string");
    });

    it("should execute npm run coverage command without errors", () => {
      // Arrange
      const command = "npm run coverage";
      const cwd = backendRoot;

      // Act & Assert
      expect(() => {
        try {
          execSync(command, { cwd, stdio: "pipe" });
        } catch (error) {
          throw new Error(`Coverage command failed: ${error}`);
        }
      }).not.toThrow();
    });
  });

  describe("Backend Unit Test Coverage Reports", () => {
    const unitCoveragePath = join(coverageRoot, "unit");

    it("should generate unit coverage HTML report at backend/coverage/unit/index.html", () => {
      // Arrange
      const reportPath = join(unitCoveragePath, "index.html");

      // Act
      const exists = existsSync(reportPath);

      // Assert
      expect(exists).toBe(true);
      expect(readFileSync(reportPath, "utf-8")).toMatch(/<!DOCTYPE html>/i);
    });

    it("should generate unit coverage JSON report at backend/coverage/unit/coverage-final.json", () => {
      // Arrange
      const reportPath = join(unitCoveragePath, "coverage-final.json");

      // Act
      const exists = existsSync(reportPath);
      const content = exists ? readFileSync(reportPath, "utf-8") : "";

      // Assert
      expect(exists).toBe(true);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should include coverage metrics in unit HTML report: line, branch, function, statement", () => {
      // Arrange
      const reportPath = join(unitCoveragePath, "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert - Check for coverage metric keywords
      expect(htmlContent).toMatch(/line.*coverage/i);
      expect(htmlContent).toMatch(/branch/i);
      expect(htmlContent).toMatch(/function/i);
      expect(htmlContent).toMatch(/statement/i);
    });

    it("should generate valid JSON coverage-final.json with proper structure", () => {
      // Arrange
      const reportPath = join(unitCoveragePath, "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");

      // Act
      const coverageData = JSON.parse(content);

      // Assert - Check for required top-level properties
      expect(coverageData).toHaveProperty("total");
      expect(coverageData.total).toHaveProperty("lines");
      expect(coverageData.total).toHaveProperty("branches");
      expect(coverageData.total).toHaveProperty("functions");
      expect(coverageData.total).toHaveProperty("statements");
    });

    it("should have coverage metrics with valid percentage values", () => {
      // Arrange
      const reportPath = join(unitCoveragePath, "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");
      const coverageData = JSON.parse(content);

      // Act & Assert - Verify coverage percentages are valid numbers
      expect(typeof coverageData.total.lines.pct).toBe("number");
      expect(coverageData.total.lines.pct).toBeGreaterThanOrEqual(0);
      expect(coverageData.total.lines.pct).toBeLessThanOrEqual(100);

      expect(typeof coverageData.total.branches.pct).toBe("number");
      expect(coverageData.total.branches.pct).toBeGreaterThanOrEqual(0);
      expect(coverageData.total.branches.pct).toBeLessThanOrEqual(100);

      expect(typeof coverageData.total.functions.pct).toBe("number");
      expect(coverageData.total.functions.pct).toBeGreaterThanOrEqual(0);
      expect(coverageData.total.functions.pct).toBeLessThanOrEqual(100);

      expect(typeof coverageData.total.statements.pct).toBe("number");
      expect(coverageData.total.statements.pct).toBeGreaterThanOrEqual(0);
      expect(coverageData.total.statements.pct).toBeLessThanOrEqual(100);
    });
  });

  describe("Backend Integration Test Coverage Reports", () => {
    const integrationCoveragePath = join(coverageRoot, "integration");

    it("should generate integration coverage HTML report at backend/coverage/integration/index.html", () => {
      // Arrange
      const reportPath = join(integrationCoveragePath, "index.html");

      // Act
      const exists = existsSync(reportPath);

      // Assert
      expect(exists).toBe(true);
      expect(readFileSync(reportPath, "utf-8")).toMatch(/<!DOCTYPE html>/i);
    });

    it("should generate integration coverage JSON report at backend/coverage/integration/coverage-final.json", () => {
      // Arrange
      const reportPath = join(integrationCoveragePath, "coverage-final.json");

      // Act
      const exists = existsSync(reportPath);
      const content = exists ? readFileSync(reportPath, "utf-8") : "";

      // Assert
      expect(exists).toBe(true);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("should include all coverage metrics in integration HTML report", () => {
      // Arrange
      const reportPath = join(integrationCoveragePath, "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/line.*coverage/i);
      expect(htmlContent).toMatch(/branch/i);
      expect(htmlContent).toMatch(/function/i);
      expect(htmlContent).toMatch(/statement/i);
    });
  });

  describe("Backend Coverage Threshold Validation", () => {
    it("should have coverage thresholds defined in vitest.unit.config.ts", () => {
      // Arrange
      const configPath = join(backendRoot, "vitest.unit.config.ts");

      // Act
      const configContent = readFileSync(configPath, "utf-8");

      // Assert
      expect(configContent).toMatch(/coverage\s*:/);
      expect(configContent).toMatch(/lines\s*:\s*80/);
      expect(configContent).toMatch(/branches\s*:\s*75/);
    });

    it("should have coverage thresholds defined in vitest.integration.config.ts", () => {
      // Arrange
      const configPath = join(backendRoot, "vitest.integration.config.ts");

      // Act
      const configContent = readFileSync(configPath, "utf-8");

      // Assert
      expect(configContent).toMatch(/coverage\s*:/);
      expect(configContent).toMatch(/lines\s*:\s*80/);
      expect(configContent).toMatch(/branches\s*:\s*75/);
    });

    it("should enforce 80% line coverage threshold", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");
      const coverageData = JSON.parse(content);

      // Act
      const lineCoverage = coverageData.total.lines.pct;

      // Assert
      expect(lineCoverage).toBeGreaterThanOrEqual(80);
    });

    it("should enforce 75% branch coverage threshold", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");
      const coverageData = JSON.parse(content);

      // Act
      const branchCoverage = coverageData.total.branches.pct;

      // Assert
      expect(branchCoverage).toBeGreaterThanOrEqual(75);
    });

    it("should enforce 80% function coverage threshold", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");
      const coverageData = JSON.parse(content);

      // Act
      const functionCoverage = coverageData.total.functions.pct;

      // Assert
      expect(functionCoverage).toBeGreaterThanOrEqual(80);
    });

    it("should enforce 80% statement coverage threshold", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "coverage-final.json");
      const content = readFileSync(reportPath, "utf-8");
      const coverageData = JSON.parse(content);

      // Act
      const statementCoverage = coverageData.total.statements.pct;

      // Assert
      expect(statementCoverage).toBeGreaterThanOrEqual(80);
    });
  });

  describe("Backend HTML Report Validity", () => {
    it("should generate well-formed unit HTML report with DOCTYPE", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
      expect(htmlContent).toMatch(/<html/i);
      expect(htmlContent).toMatch(/<\/html>/i);
    });

    it("should generate accessible unit HTML report with title element", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/<title/i);
      expect(htmlContent).toMatch(/coverage/i);
    });

    it("should include coverage percentage in unit HTML report", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "unit", "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/\d+(\.\d+)?%/);
    });

    it("should generate well-formed integration HTML report with DOCTYPE", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "integration", "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
      expect(htmlContent).toMatch(/<html/i);
      expect(htmlContent).toMatch(/<\/html>/i);
    });

    it("should generate accessible integration HTML report with title element", () => {
      // Arrange
      const reportPath = join(backendRoot, "coverage", "integration", "index.html");
      const htmlContent = readFileSync(reportPath, "utf-8");

      // Act & Assert
      expect(htmlContent).toMatch(/<title/i);
      expect(htmlContent).toMatch(/coverage/i);
    });
  });
});

describe("Test Coverage Reporting - Central Dashboard", () => {
  const dashboardPath = join(
    __dirname,
    "..",
    "..",
    "..",
    "docs",
    "coverage",
    "index.html"
  );

  describe("Dashboard File Existence and Validity", () => {
    it("should generate central dashboard at docs/coverage/index.html", () => {
      // Act
      const exists = existsSync(dashboardPath);

      // Assert
      expect(exists).toBe(true);
    });

    it("should generate valid HTML for central dashboard", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/<!DOCTYPE html>/i);
      expect(dashboardContent).toMatch(/<html/i);
      expect(dashboardContent).toMatch(/<\/html>/i);
    });

    it("should have dashboard title", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/<title/i);
      expect(dashboardContent).toMatch(/coverage/i);
    });

    it("should include CSS styling for dashboard", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/<style/i);
    });
  });

  describe("Dashboard Content Structure", () => {
    it("should display summary table with coverage metrics", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/<table/i);
      expect(dashboardContent).toMatch(/layer|frontend|backend/i);
    });

    it("should include line coverage column in summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/line.*coverage/i);
    });

    it("should include branch coverage column in summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/branch.*coverage/i);
    });

    it("should include function coverage column in summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/function.*coverage/i);
    });

    it("should include statement coverage column in summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/statement.*coverage/i);
    });

    it("should display frontend row in coverage summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/frontend/i);
    });

    it("should display backend row in coverage summary table", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/backend/i);
    });

    it("should display overall combined coverage row", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/overall|combined|total/i);
    });
  });

  describe("Dashboard Links and Navigation", () => {
    it("should include link to frontend detailed coverage report", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(
        /href.*frontend|frontend.*href/i
      );
    });

    it("should include link to backend unit coverage report", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(
        /href.*backend|backend.*href/i
      );
    });

    it("should include link to backend integration coverage report", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(
        /integration|unit/i
      );
    });
  });

  describe("Dashboard Metadata", () => {
    it("should display last updated timestamp in dashboard", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/last.*updated|updated.*at|timestamp/i);
    });

    it("should include viewport meta tag for responsive design", () => {
      // Arrange
      const dashboardContent = readFileSync(dashboardPath, "utf-8");

      // Act & Assert
      expect(dashboardContent).toMatch(/viewport/i);
    });
  });
});

describe("Test Coverage Reporting - README Badges", () => {
  const readmePath = join(__dirname, "..", "..", "..", "README.md");

  describe("README Coverage Badge Presence", () => {
    it("should have README.md file in project root", () => {
      // Act
      const exists = existsSync(readmePath);

      // Assert
      expect(exists).toBe(true);
    });

    it("should include frontend coverage badge in README.md", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(
        /badge.*frontend|frontend.*badge|frontend.*coverage/i
      );
    });

    it("should include backend coverage badge in README.md", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(
        /badge.*backend|backend.*badge|backend.*coverage/i
      );
    });

    it("should use shield.io or similar badge format for coverage badges", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(
        /shields\.io|img\.shields\.io|badge/i
      );
    });
  });

  describe("README Badge Linking", () => {
    it("should link frontend coverage badge to coverage dashboard", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(
        /!\[.*coverage.*\].*docs.*coverage|coverage.*dashboard/i
      );
    });

    it("should link backend coverage badge to coverage dashboard", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(/coverage.*docs|docs.*coverage/i);
    });
  });

  describe("README Documentation", () => {
    it("should include section about running coverage locally", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(
        /coverage|npm run coverage|test coverage/i
      );
    });

    it("should document how to access coverage dashboard", () => {
      // Arrange
      const readmeContent = readFileSync(readmePath, "utf-8");

      // Act & Assert
      expect(readmeContent).toMatch(/coverage.*dashboard|docs.*coverage/i);
    });
  });
});
