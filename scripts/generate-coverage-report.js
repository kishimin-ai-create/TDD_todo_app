const fs = require('fs');
const path = require('path');

function generateDashboard() {
  // Read coverage JSON files
  const frontendCoverage = readCoverageFile('frontend/coverage/coverage-final.json');
  const backendUnitCoverage = readCoverageFile('backend/coverage/unit/coverage-final.json');
  const backendIntegrationCoverage = readCoverageFile('backend/coverage/integration/coverage-final.json');
  
  // Extract metrics
  const frontendMetrics = extractMetrics(frontendCoverage);
  const backendUnitMetrics = extractMetrics(backendUnitCoverage);
  const backendIntegrationMetrics = extractMetrics(backendIntegrationCoverage);
  
  // Calculate overall
  const overallMetrics = calculateOverall([
    frontendMetrics,
    backendUnitMetrics,
    backendIntegrationMetrics
  ]);
  
  // Generate HTML
  const html = generateHTML(frontendMetrics, backendUnitMetrics, backendIntegrationMetrics, overallMetrics);
  
  // Write dashboard
  const docsDir = path.join(process.cwd(), 'docs', 'coverage');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(docsDir, 'index.html'), html);
  console.log('Coverage dashboard generated at docs/coverage/index.html');
}

function readCoverageFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function extractMetrics(coverage) {
  if (!coverage) return { lines: 0, branches: 0, functions: 0, statements: 0 };
  
  const total = coverage.total || {};
  return {
    lines: Math.round(total.lines?.pct || 0),
    branches: Math.round(total.branches?.pct || 0),
    functions: Math.round(total.functions?.pct || 0),
    statements: Math.round(total.statements?.pct || 0)
  };
}

function calculateOverall(metricsArray) {
  const filtered = metricsArray.filter(m => m && Object.keys(m).length > 0);
  if (filtered.length === 0) return { lines: 0, branches: 0, functions: 0, statements: 0 };
  
  return {
    lines: Math.round(filtered.reduce((sum, m) => sum + m.lines, 0) / filtered.length),
    branches: Math.round(filtered.reduce((sum, m) => sum + m.branches, 0) / filtered.length),
    functions: Math.round(filtered.reduce((sum, m) => sum + m.functions, 0) / filtered.length),
    statements: Math.round(filtered.reduce((sum, m) => sum + m.statements, 0) / filtered.length)
  };
}

function generateHTML(frontend, backendUnit, backendIntegration, overall) {
  const timestamp = new Date().toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    h1 { color: #333; margin-bottom: 10px; }
    .timestamp { color: #999; font-size: 14px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #fafafa; }
    .metric { font-weight: 600; }
    .good { color: #28a745; }
    .warning { color: #ffc107; }
    .critical { color: #dc3545; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Coverage Dashboard</h1>
    <p class="timestamp">Last updated: ${timestamp}</p>
    
    <h2 style="margin-top: 40px; margin-bottom: 20px; color: #333;">Coverage Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Test Type</th>
          <th>Line Coverage</th>
          <th>Branch Coverage</th>
          <th>Function Coverage</th>
          <th>Statement Coverage</th>
          <th>Report</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Frontend</td>
          <td>Unit</td>
          <td class="metric ${frontend.lines >= 80 ? 'good' : frontend.lines >= 75 ? 'warning' : 'critical'}">${frontend.lines}%</td>
          <td class="metric ${frontend.branches >= 75 ? 'good' : frontend.branches >= 70 ? 'warning' : 'critical'}">${frontend.branches}%</td>
          <td class="metric ${frontend.functions >= 80 ? 'good' : frontend.functions >= 75 ? 'warning' : 'critical'}">${frontend.functions}%</td>
          <td class="metric ${frontend.statements >= 80 ? 'good' : frontend.statements >= 75 ? 'warning' : 'critical'}">${frontend.statements}%</td>
          <td><a href="../frontend/coverage/index.html" target="_blank">View Report</a></td>
        </tr>
        <tr>
          <td>Backend</td>
          <td>Unit</td>
          <td class="metric ${backendUnit.lines >= 80 ? 'good' : backendUnit.lines >= 75 ? 'warning' : 'critical'}">${backendUnit.lines}%</td>
          <td class="metric ${backendUnit.branches >= 75 ? 'good' : backendUnit.branches >= 70 ? 'warning' : 'critical'}">${backendUnit.branches}%</td>
          <td class="metric ${backendUnit.functions >= 80 ? 'good' : backendUnit.functions >= 75 ? 'warning' : 'critical'}">${backendUnit.functions}%</td>
          <td class="metric ${backendUnit.statements >= 80 ? 'good' : backendUnit.statements >= 75 ? 'warning' : 'critical'}">${backendUnit.statements}%</td>
          <td><a href="../backend/coverage/unit/index.html" target="_blank">View Report</a></td>
        </tr>
        <tr>
          <td>Backend</td>
          <td>Integration</td>
          <td class="metric ${backendIntegration.lines >= 80 ? 'good' : backendIntegration.lines >= 75 ? 'warning' : 'critical'}">${backendIntegration.lines}%</td>
          <td class="metric ${backendIntegration.branches >= 75 ? 'good' : backendIntegration.branches >= 70 ? 'warning' : 'critical'}">${backendIntegration.branches}%</td>
          <td class="metric ${backendIntegration.functions >= 80 ? 'good' : backendIntegration.functions >= 75 ? 'warning' : 'critical'}">${backendIntegration.functions}%</td>
          <td class="metric ${backendIntegration.statements >= 80 ? 'good' : backendIntegration.statements >= 75 ? 'warning' : 'critical'}">${backendIntegration.statements}%</td>
          <td></td>
        </tr>
        <tr style="background: #f9f9f9; font-weight: 600;">
          <td colspan="2">Overall Combined</td>
          <td class="metric ${overall.lines >= 80 ? 'good' : overall.lines >= 75 ? 'warning' : 'critical'}">${overall.lines}%</td>
          <td class="metric ${overall.branches >= 75 ? 'good' : overall.branches >= 70 ? 'warning' : 'critical'}">${overall.branches}%</td>
          <td class="metric ${overall.functions >= 80 ? 'good' : overall.functions >= 75 ? 'warning' : 'critical'}">${overall.functions}%</td>
          <td class="metric ${overall.statements >= 80 ? 'good' : overall.statements >= 75 ? 'warning' : 'critical'}">${overall.statements}%</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
      <p>📝 <strong>Coverage Thresholds:</strong> Lines ≥ 80%, Branches ≥ 75%, Functions ≥ 80%, Statements ≥ 80%</p>
      <p style="margin-top: 10px;">🔗 <strong>Run Coverage Locally:</strong></p>
      <ul style="margin-left: 20px; margin-top: 5px;">
        <li><code>npm run coverage:frontend</code> - Generate frontend coverage report</li>
        <li><code>npm run coverage:backend</code> - Generate backend coverage reports</li>
        <li><code>npm run coverage:report</code> - Generate this dashboard</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
}

generateDashboard();
