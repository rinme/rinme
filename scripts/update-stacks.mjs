import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const README_PATH = path.resolve(__dirname, '../README.md');

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

  // Detect frameworks from active repos package.json and requirements.txt
  const detectedFrameworks = new Set(['nodejs']);
  const detectedTools = new Set(DEFAULT_TOOLS);

  for (const repo of targetRepos.slice(0, 15)) {
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

        for (const [dep, icon] of Object.entries(FRAMEWORK_MAP)) {
          if (allDeps[dep]) {
            detectedFrameworks.add(icon);
          }
        }

        if (allDeps['bun-types'] || allDeps['bun']) {
          detectedTools.add('bun');
        }
      }
    } catch (e) {
      // Ignore package.json read errors
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

  // De-duplicate while preserving order
  const languageIcons = Array.from(new Set(sortedLanguages));

  // Fallback defaults if API is rate-limited or empty
  if (languageIcons.length === 0) {
    languageIcons.push('ts', 'js', 'html', 'css', 'py', 'rust', 'dart', 'lua', 'php', 'bash');
  }

  // Include core favorites if not already present
  if (!detectedFrameworks.has('discord')) detectedFrameworks.add('discord');
  if (!detectedFrameworks.has('pytorch')) detectedFrameworks.add('pytorch');

  const frameworkIcons = Array.from(detectedFrameworks);
  const toolIcons = Array.from(detectedTools);

  console.log('Detected Languages:', languageIcons);
  console.log('Detected Frameworks:', frameworkIcons);
  console.log('Tools:', toolIcons);

  const skillsBlock = `<!-- START_STACKS -->
<p align="left">
  <b>Languages (Auto-updated from GitHub activity)</b><br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${languageIcons.slice(0, 12).join(',')}" alt="Languages" />
  </a>
</p>

<p align="left">
  <b>Libraries & Frameworks</b><br/>
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=${frameworkIcons.join(',')}" alt="Libraries & Frameworks" />
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
    // Replace the previous static skills section
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
