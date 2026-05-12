const fs = require('fs');

const args = process.argv.slice(2);
const deleteSources = args.includes('--delete-sources');
const positionalArgs = args.filter((arg) => arg !== '--delete-sources');

if (positionalArgs.length < 3) {
  console.error('Usage: node merge-vitest-reports.cjs <input...> <output> [--delete-sources]');
  process.exit(1);
}

const outputPath = positionalArgs.at(-1);
const inputPaths = positionalArgs.slice(0, -1);

const numberFields = [
  'numTotalTestSuites',
  'numPassedTestSuites',
  'numFailedTestSuites',
  'numPendingTestSuites',
  'numTotalTests',
  'numPassedTests',
  'numFailedTests',
  'numPendingTests',
  'numTodoTests',
];

const snapshotNumberFields = [
  'added',
  'filesAdded',
  'filesRemoved',
  'filesUnmatched',
  'filesUpdated',
  'matched',
  'total',
  'unchecked',
  'unmatched',
  'updated',
];

const reports = inputPaths.map((inputPath) => JSON.parse(fs.readFileSync(inputPath, 'utf8')));

const mergedSnapshot = reports.reduce(
  (snapshot, report) => {
    const current = report.snapshot ?? {};

    for (const field of snapshotNumberFields) {
      snapshot[field] += current[field] ?? 0;
    }

    snapshot.failure = snapshot.failure || Boolean(current.failure);
    snapshot.didUpdate = snapshot.didUpdate || Boolean(current.didUpdate);
    snapshot.filesRemovedList.push(...(current.filesRemovedList ?? []));
    snapshot.uncheckedKeysByFile.push(...(current.uncheckedKeysByFile ?? []));

    return snapshot;
  },
  {
    added: 0,
    failure: false,
    filesAdded: 0,
    filesRemoved: 0,
    filesRemovedList: [],
    filesUnmatched: 0,
    filesUpdated: 0,
    matched: 0,
    total: 0,
    unchecked: 0,
    uncheckedKeysByFile: [],
    unmatched: 0,
    updated: 0,
    didUpdate: false,
  },
);

const mergedReport = {
  snapshot: mergedSnapshot,
  startTime: Math.min(...reports.map((report) => report.startTime ?? Date.now())),
  success: reports.every((report) => report.success),
  testResults: reports.flatMap((report) => report.testResults ?? []),
};

for (const field of numberFields) {
  mergedReport[field] = reports.reduce((sum, report) => sum + (report[field] ?? 0), 0);
}

fs.writeFileSync(outputPath, JSON.stringify(mergedReport));

if (deleteSources) {
  for (const inputPath of inputPaths) {
    fs.unlinkSync(inputPath);
  }
}
