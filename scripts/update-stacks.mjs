import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const README_PATH = path.resolve(__dirname, '../README.md');
const MEDIA_DIR = path.resolve(__dirname, '../media');
const SVG_PATH = path.resolve(MEDIA_DIR, 'languages-bar.svg');

const USERNAME = process.env.GITHUB_ACTOR || process.env.GITHUB_REPOSITORY_OWNER || 'rinme';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  'User-Agent': 'rinme-readme-updater',
  'Accept': 'application/vnd.github.v3+json',
};

if (GITHUB_TOKEN) {
  headers['Authorization'] = `token ${GITHUB_TOKEN}`;
}

const LANGUAGE_MAP = {
  'TypeScript': 'ts',
  'JavaScript': 'js',
  'Python': 'py',
  'HTML': 'html',
  'CSS': 'css',
  'Rust': 'rust',
  'Dart': 'dart',
  'Lua': 'lua',
  'Luau': 'lua',
  'PHP': 'php',
  'Kotlin': 'kotlin',
  'Java': 'java',
  'C++': 'cpp',
  'C': 'c',
  'C#': 'cs',
  'Go': 'go',
  'Shell': 'bash',
  'Bash': 'bash',
  'Swift': 'swift',
  'Ruby': 'ruby',
  'Astro': 'astro',
  'Vue': 'vue',
  'Svelte': 'svelte',
};

const LANGUAGE_COLORS = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Rust': '#dea584',
  'Dart': '#00B4AB',
  'Lua': '#000080',
  'Luau': '#00A2FF',
  'PHP': '#4F5D95',
  'Kotlin': '#A97BFF',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#178600',
  'Go': '#00ADD8',
  'Shell': '#89e051',
  'Bash': '#89e051',
  'Swift': '#F05138',
  'Ruby': '#701516',
  'Astro': '#ff5a03',
  'Vue': '#41b883',
  'Svelte': '#ff3e00',
  'Other': '#8b949e',
};

const FRAMEWORK_MAP = {
  'next': 'nextjs',
  'react': 'react',
  'vue': 'vue',
  'svelte': 'svelte',
  'astro': 'astro',
  '@astrojs/vue': 'astro',
  'tailwindcss': 'tailwind',
  '@tailwindcss/postcss': 'tailwind',
  '@prisma/client': 'prisma',
  'prisma': 'prisma',
  'discord.js': 'discord',
  'discord.py': 'discord',
  'torch': 'pytorch',
  'pytorch': 'pytorch',
  'express': 'express',
  'fastapi': 'fastapi',
  'flask': 'flask',
  'django': 'django',
  'electron': 'electron',
  'vite': 'vite',
  'webpack': 'webpack',
  'three': 'threejs',
  'pinia': 'pinia',
  'redux': 'redux',
  '@reduxjs/toolkit': 'redux',
};

const DEFAULT_TOOLS = [
  'vscode',
  'yarn',
  'npm',
  'blender',
  'unity',
  'premiere',
  'git',
  'github'
];

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function generateLanguagesBarSvg(languageBytes) {
  const sorted = Array.from(languageBytes.entries())
    .filter(([_, bytes]) => bytes > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalBytes = sorted.reduce((sum, [_, bytes]) => sum + bytes, 0);
  if (totalBytes === 0) {
    return '';
  }

  // Calculate percentages
  let items = sorted.map(([lang, bytes]) => {
    return {
      name: lang,
      bytes,
      percentage: (bytes / totalBytes) * 100,
      color: LANGUAGE_COLORS[lang] || '#8b949e',
    };
  });

  // Keep top 6 languages and group the rest into 'Other' if more than 7 languages
  if (items.length > 7) {
    const top = items.slice(0, 6);
    const rest = items.slice(6);
    const otherBytes = rest.reduce((sum, item) => sum + item.bytes, 0);
    const otherPct = (otherBytes / totalBytes) * 100;
    top.push({
      name: 'Other',
      bytes: otherBytes,
      percentage: otherPct,
      color: LANGUAGE_COLORS['Other'],
    });
    items = top;
  }

  const svgWidth = 650;
  const barHeight = 10;
  const colWidth = 210;
  const numCols = 3;
  const numRows = Math.ceil(items.length / numCols);
  const legendStartY = 30;
  const rowHeight = 22;
  const svgHeight = legendStartY + (numRows * rowHeight) + 8;

  let currentX = 0;
  const barSegments = items.map(item => {
    const width = Math.max((item.percentage / 100) * svgWidth, 1.5);
    const seg = `<rect x="${currentX.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${barHeight}" fill="${item.color}" />`;
    currentX += width;
    return seg;
  }).join('\n    ');

  const legendItems = items.map((item, idx) => {
    const col = idx % numCols;
    const row = Math.floor(idx / numCols);
    const x = 5 + (col * colWidth);
    const y = legendStartY + (row * rowHeight);
    return `
    <g transform="translate(${x}, ${y})">
      <circle cx="5" cy="-4" r="5" fill="${item.color}" />
      <text x="16" y="0" class="lang-text">${item.name} <tspan class="lang-pct">${item.percentage.toFixed(1)}%</tspan></text>
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}">
  <style>
    .lang-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      fill: #24292f;
    }
    .lang-pct {
      font-weight: 400;
      fill: #57606a;
    }
    @media (prefers-color-scheme: dark) {
      .lang-text {
        fill: #e6edf3;
      }
      .lang-pct {
        fill: #8b949e;
      }
    }
  </style>
  <clipPath id="bar-clip">
    <rect x="0" y="0" width="${svgWidth}" height="${barHeight}" rx="5" />
  </clipPath>
  <g clip-path="url(#bar-clip)">
    ${barSegments}
  </g>
  ${legendItems}
</svg>
`;
}

async function main() {
  console.log(`Scanning GitHub activity for user: ${USERNAME}`);

  let repos = [];
  try {
    const data = await fetchJSON(`https://api.github.com/users/${USERNAME}/repos?per_page=100&type=owner&sort=pushed`);
    if (Array.isArray(data)) {
      repos = data.filter(r => !r.archived);
    }
  } catch (err) {
    console.error('Warning fetching repos list:', err.message);
  }

  // Aggregate language bytes across repositories (prioritizing non-forks)
  const languageBytes = new Map();
  const ownRepos = repos.filter(r => !r.fork);
  const targetRepos = ownRepos.length > 0 ? ownRepos : repos;

  for (const repo of targetRepos.slice(0, 20)) {
    try {
      const langs = await fetchJSON(repo.languages_url);
      if (langs && typeof langs === 'object') {
        for (const [lang, bytes] of Object.entries(langs)) {
          languageBytes.set(lang, (languageBytes.get(lang) || 0) + bytes);
        }
      }
    } catch (e) {
      // Continue silently if a single repo language call fails
    }
  }

  // Track framework and tool usage frequency
  const frameworkCounts = new Map();
  const detectedTools = new Set(DEFAULT_TOOLS);

  for (const repo of targetRepos.slice(0, 20)) {
    // Check package.json
    try {
      const pkgUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/package.json`;
      const pkgRes = await fetch(pkgUrl, { headers });
      if (pkgRes.ok) {
        const pkg = await pkgRes.json();
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {})
        };

        frameworkCounts.set('nodejs', (frameworkCounts.get('nodejs') || 0) + 1);

        const seenInRepo = new Set();
        for (const [dep, icon] of Object.entries(FRAMEWORK_MAP)) {
          if (allDeps[dep]) {
            seenInRepo.add(icon);
          }
        }
        for (const icon of seenInRepo) {
          frameworkCounts.set(icon, (frameworkCounts.get(icon) || 0) + 1);
        }

        if (allDeps['bun-types'] || allDeps['bun']) {
          detectedTools.add('bun');
        }
      }
    } catch (e) {
      // Ignore package.json read errors
    }

    // Check requirements.txt for Python frameworks
    try {
      const reqUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/requirements.txt`;
      const reqRes = await fetch(reqUrl, { headers });
      if (reqRes.ok) {
        const reqText = await reqRes.text();
        const lower = reqText.toLowerCase();
        const seenInRepo = new Set();
        for (const [dep, icon] of Object.entries(FRAMEWORK_MAP)) {
          if (lower.includes(dep.toLowerCase())) {
            seenInRepo.add(icon);
          }
        }
        for (const icon of seenInRepo) {
          frameworkCounts.set(icon, (frameworkCounts.get(icon) || 0) + 1);
        }
      }
    } catch (e) {
      // Ignore requirements.txt read errors
    }

    // Check Docker usage
    if (repo.name.toLowerCase().includes('docker')) {
      detectedTools.add('docker');
    }
  }

  // Map languages to skillicons keys sorted by total bytes
  const sortedLanguages = Array.from(languageBytes.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => LANGUAGE_MAP[lang])
    .filter(Boolean);

  // De-duplicate while preserving order (most used to least used)
  const languageIcons = Array.from(new Set(sortedLanguages));

  // Fallback defaults if API is rate-limited or empty
  if (languageIcons.length === 0) {
    languageIcons.push('ts', 'js', 'html', 'css', 'py', 'rust', 'dart', 'lua', 'php', 'bash');
  }

  // Ensure favorites are present
  if (!frameworkCounts.has('discord')) frameworkCounts.set('discord', 1);
  if (!frameworkCounts.has('pytorch')) frameworkCounts.set('pytorch', 1);

  // Sort frameworks by frequency descending (most used to least used)
  const sortedFrameworks = Array.from(frameworkCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([icon]) => icon);

  const toolIcons = Array.from(detectedTools);

  console.log('Language Byte Distribution (Bytes):', Object.fromEntries(languageBytes));
  console.log('Detected Languages (Sorted):', languageIcons);
  console.log('Detected Frameworks (Frequency Sorted):', sortedFrameworks);
  console.log('Tools:', toolIcons);

  // Generate and save SVG language bar
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const svgContent = generateLanguagesBarSvg(languageBytes);
  if (svgContent) {
    fs.writeFileSync(SVG_PATH, svgContent, 'utf-8');
    console.log(`Saved language breakdown bar SVG to ${SVG_PATH}`);
  }

  const skillsBlock = `<!-- START_STACKS -->
<p align="left">
  <b>Languages (Auto-updated from GitHub activity)</b><br/>
  <img src="./media/languages-bar.svg" alt="Languages Breakdown" /><br/><br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${languageIcons.slice(0, 12).join(',')}" alt="Languages" />
  </a>
</p>

<p align="left">
  <b>Libraries & Frameworks</b><br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${sortedFrameworks.join(',')}" alt="Libraries & Frameworks" />
  </a>
</p>

<p align="left">
  <b>Tools & Creative</b><br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${toolIcons.join(',')}" alt="Tools & Creative" />
  </a>
</p>
<!-- END_STACKS -->`;

  let readmeContent = fs.readFileSync(README_PATH, 'utf-8');

  const regex = /<!-- START_STACKS -->[\s\S]*?<!-- END_STACKS -->/;
  if (regex.test(readmeContent)) {
    readmeContent = readmeContent.replace(regex, skillsBlock);
  } else {
    const fallbackRegex = /### Skills & Tech Stack[\s\S]*?(?=---)/;
    if (fallbackRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(fallbackRegex, `### Skills & Tech Stack\n\n${skillsBlock}\n\n`);
    } else {
      readmeContent += `\n\n### Skills & Tech Stack\n\n${skillsBlock}\n`;
    }
  }

  fs.writeFileSync(README_PATH, readmeContent, 'utf-8');
  console.log('Successfully updated README.md with latest tech stacks!');
}

main().catch(err => {
  console.error('Error running stack updater:', err);
  process.exit(1);
});
