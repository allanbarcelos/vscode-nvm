import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const isWin = process.platform === 'win32';

/** Directory that holds one sub-directory per installed node version. */
export function versionsDir(env: NodeJS.ProcessEnv = process.env): string {
  if (isWin) {
    return env.NVM_HOME || path.join(env.APPDATA || os.homedir(), 'nvm');
  }
  return path.join(nvmDir(env), 'versions', 'node');
}

function nvmDir(env: NodeJS.ProcessEnv): string {
  return env.NVM_DIR || path.join(os.homedir(), '.nvm');
}

/** Directory to prepend to PATH for a given installed version. */
export function binDir(version: string, env: NodeJS.ProcessEnv = process.env): string {
  const dir = path.join(versionsDir(env), version);
  return isWin ? dir : path.join(dir, 'bin');
}

/** Path to the node executable of a given installed version. */
export function nodeExecutable(version: string, env: NodeJS.ProcessEnv = process.env): string {
  return path.join(binDir(version, env), isWin ? 'node.exe' : 'node');
}

/** Extracts the version spec from the contents of a `.nvmrc` file. */
export function parseNvmrc(content: string): string | undefined {
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (line) {
      return line;
    }
  }
  return undefined;
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/, '').split('.').map(Number);
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) {
      return (pa[i] || 0) - (pb[i] || 0);
    }
  }
  return 0;
}

/**
 * Picks the installed version matching a version spec such as `v10.14.0`,
 * `10.14`, `10` or `node`. Partial specs resolve to the highest match.
 */
export function matchVersion(spec: string, installed: string[]): string | undefined {
  const versions = installed
    .filter((v) => /^v?\d+\.\d+\.\d+$/.test(v))
    .sort(compareVersions)
    .reverse();
  if (spec === 'node' || spec === 'stable') {
    return versions[0];
  }
  if (!/^v?\d+(\.\d+){0,2}$/.test(spec)) {
    return undefined;
  }
  const wanted = parseVersion(spec);
  return versions.find((v) => {
    const parts = parseVersion(v);
    return wanted.every((n, i) => parts[i] === n);
  });
}

async function readAlias(name: string, env: NodeJS.ProcessEnv): Promise<string | undefined> {
  if (isWin) {
    return undefined;
  }
  try {
    const target = await fs.readFile(path.join(nvmDir(env), 'alias', name), 'utf8');
    return target.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function installedVersions(env: NodeJS.ProcessEnv): Promise<string[]> {
  try {
    return await fs.readdir(versionsDir(env));
  } catch {
    return [];
  }
}

/**
 * Resolves a `.nvmrc` spec to an installed version directory name, following
 * nvm aliases such as `lts/*` or `default`.
 */
export async function resolveVersion(spec: string, env: NodeJS.ProcessEnv = process.env): Promise<string | undefined> {
  const installed = await installedVersions(env);
  let current = spec;
  for (let depth = 0; depth < 10; depth++) {
    const match = matchVersion(current, installed);
    if (match) {
      return match;
    }
    const alias = await readAlias(current, env);
    if (!alias) {
      return undefined;
    }
    current = alias;
  }
  return undefined;
}
