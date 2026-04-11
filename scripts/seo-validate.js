const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BUILD_INDEX = path.join(ROOT, 'build', 'index.html');
const BUILD_ROBOTS = path.join(ROOT, 'build', 'robots.txt');

const fail = (message) => {
  console.error(`SEO validation failed: ${message}`);
  process.exitCode = 1;
};

const ensureFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${filePath}`);
    return false;
  }
  return true;
};

const validateTitle = () => {
  if (!ensureFile(BUILD_INDEX)) return;

  const html = fs.readFileSync(BUILD_INDEX, 'utf8');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (!titleMatch) {
    fail('build/index.html does not contain a <title> element.');
    return;
  }

  const titleText = titleMatch[1].replace(/\s+/g, ' ').trim();
  if (!titleText) {
    fail('build/index.html contains an empty <title> element.');
  }
};

const validateRobots = () => {
  if (!ensureFile(BUILD_ROBOTS)) return;

  const allowedDirectives = new Set([
    'user-agent',
    'allow',
    'disallow',
    'sitemap',
    'host',
    'crawl-delay',
    'clean-param',
    'request-rate',
    'visit-time',
  ]);

  const robots = fs.readFileSync(BUILD_ROBOTS, 'utf8');
  const lines = robots.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      fail(`robots.txt line ${index + 1} is malformed: "${trimmed}"`);
      return;
    }

    const directive = trimmed.slice(0, separatorIndex).trim().toLowerCase();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!allowedDirectives.has(directive)) {
      fail(`robots.txt line ${index + 1} uses unknown directive: "${directive}"`);
      return;
    }

    if (!value) {
      fail(`robots.txt line ${index + 1} has an empty value for directive "${directive}"`);
      return;
    }

    if (directive === 'content-signal') {
      fail(`robots.txt line ${index + 1} contains unsupported directive "Content-Signal"`);
    }
  });
};

validateTitle();
validateRobots();

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('SEO validation passed: title and robots.txt checks are valid.');
