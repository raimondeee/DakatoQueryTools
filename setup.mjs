#!/usr/bin/env node
/**
 * Local setup for Dakato Query Tools.
 * Run: node setup.mjs   (or ./setup.sh / setup.bat)
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const MIN_NODE_MAJOR = 18;

function log(message) {
  console.log(message);
}

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

function checkNodeVersion() {
  const version = process.version;
  const major = Number.parseInt(version.slice(1).split('.')[0], 10);
  log(`Node.js ${version}`);

  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    fail(
      `Node.js ${MIN_NODE_MAJOR}+ is required. Install from https://nodejs.org/ and run setup again.`,
    );
  }
}

function checkNpm() {
  const result = spawnSync('npm', ['--version'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('npm was not found. Install Node.js (includes npm) from https://nodejs.org/');
  }

  log(`npm ${result.stdout.trim()}`);
}

function installDependencies() {
  log('\nInstalling dependencies (npm install)…\n');

  const result = spawnSync('npm', ['install'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fail('npm install failed. Check your network connection and try again.');
  }
}

function ensureDataDirectory() {
  const dataDir = path.join(ROOT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const queriesFile = path.join(dataDir, 'queries.json');
  const exampleFile = path.join(dataDir, 'queries.example.json');

  if (!fs.existsSync(queriesFile) && fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, queriesFile);
    log('\nCreated data/queries.json from queries.example.json');
  } else if (!fs.existsSync(queriesFile)) {
    log('\nQuery storage: data/queries.json will be created on first run.');
  } else {
    log('\nUsing existing data/queries.json');
  }
}

function printNextSteps() {
  log(`
Setup complete.

Start the app:
  npm run dev

Then open:
  http://localhost:5173

Other commands:
  npm run build   — production build
  npm run preview — build and serve locally (port 4173)
  npm test        — run tests

Queries are saved in data/queries.json on this machine.
Use Export JSON / Import JSON in the sidebar to share templates with others.
`);
}

function main() {
  log('Dakato Query Tools — local setup\n');

  process.chdir(ROOT);
  checkNodeVersion();
  checkNpm();
  installDependencies();
  ensureDataDirectory();
  printNextSteps();
}

main();
