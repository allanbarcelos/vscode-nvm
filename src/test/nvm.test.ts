import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { matchVersion, parseNvmrc, resolveVersion, versionsDir } from '../nvm';

suite('parseNvmrc', () => {
  test('reads a plain version', () => {
    assert.strictEqual(parseNvmrc('v10.14.0'), 'v10.14.0');
  });

  test('ignores whitespace, blank lines and comments', () => {
    assert.strictEqual(parseNvmrc('\r\n  # pinned\n  lts/* \r\n'), 'lts/*');
  });

  test('returns undefined for an empty file', () => {
    assert.strictEqual(parseNvmrc(' \n# nothing\n'), undefined);
  });
});

suite('matchVersion', () => {
  const installed = ['v10.14.0', 'v10.24.1', 'v22.22.3', 'v8.9.4', '.DS_Store'];

  test('matches an exact version with or without v', () => {
    assert.strictEqual(matchVersion('v10.14.0', installed), 'v10.14.0');
    assert.strictEqual(matchVersion('10.14.0', installed), 'v10.14.0');
  });

  test('matches the highest version for a partial spec', () => {
    assert.strictEqual(matchVersion('10', installed), 'v10.24.1');
    assert.strictEqual(matchVersion('v10.14', installed), 'v10.14.0');
  });

  test('compares versions numerically', () => {
    assert.strictEqual(matchVersion('node', installed), 'v22.22.3');
  });

  test('returns undefined for missing versions and aliases', () => {
    assert.strictEqual(matchVersion('18', installed), undefined);
    assert.strictEqual(matchVersion('lts/*', installed), undefined);
  });
});

suite('resolveVersion', () => {
  let env: NodeJS.ProcessEnv;
  let root: string;

  setup(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-nvm-'));
    env = { NVM_DIR: root, NVM_HOME: root };
    for (const v of ['v20.11.0', 'v22.22.3']) {
      fs.mkdirSync(path.join(versionsDir(env), v), { recursive: true });
    }
  });

  teardown(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('resolves an installed version', async () => {
    assert.strictEqual(await resolveVersion('20', env), 'v20.11.0');
  });

  test('returns undefined when nothing matches', async () => {
    assert.strictEqual(await resolveVersion('18', env), undefined);
  });

  test('follows nvm aliases', async function () {
    if (process.platform === 'win32') {
      this.skip();
    }
    fs.mkdirSync(path.join(root, 'alias', 'lts'), { recursive: true });
    fs.writeFileSync(path.join(root, 'alias', 'lts', '*'), 'lts/jod\n');
    fs.writeFileSync(path.join(root, 'alias', 'lts', 'jod'), 'v22.22.3\n');
    assert.strictEqual(await resolveVersion('lts/*', env), 'v22.22.3');
  });
});
