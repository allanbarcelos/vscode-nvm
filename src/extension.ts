import * as path from 'path';
import * as vscode from 'vscode';
import { binDir, nodeExecutable, parseNvmrc, resolveVersion } from './nvm';

/** Resolved node executable per workspace folder URI. */
const nodePaths = new Map<string, string>();
const watchers = new Map<string, vscode.Disposable>();

async function readNvmrc(folder: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder, '.nvmrc'));
    return parseNvmrc(Buffer.from(bytes).toString('utf8'));
  } catch {
    return undefined;
  }
}

async function apply(context: vscode.ExtensionContext, folder: vscode.WorkspaceFolder) {
  const key = folder.uri.toString();
  const env = context.environmentVariableCollection.getScoped({ workspaceFolder: folder });
  env.clear();
  nodePaths.delete(key);

  const spec = await readNvmrc(folder.uri);
  if (!spec) {
    return;
  }
  const version = await resolveVersion(spec);
  if (!version) {
    vscode.window.showWarningMessage(
      `vscode-nvm: node ${spec} from .nvmrc is not installed. Run \`nvm install\` in ${folder.name}.`,
    );
    return;
  }

  env.description = `Node ${version} from .nvmrc`;
  env.prepend('PATH', binDir(version) + path.delimiter);
  nodePaths.set(key, nodeExecutable(version));
}

function watch(context: vscode.ExtensionContext, folder: vscode.WorkspaceFolder) {
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, '.nvmrc'));
  const update = () => apply(context, folder);
  watcher.onDidCreate(update);
  watcher.onDidChange(update);
  watcher.onDidDelete(update);
  watchers.set(folder.uri.toString(), watcher);
  return update();
}

function unwatch(context: vscode.ExtensionContext, folder: vscode.WorkspaceFolder) {
  const key = folder.uri.toString();
  watchers.get(key)?.dispose();
  watchers.delete(key);
  nodePaths.delete(key);
  context.environmentVariableCollection.getScoped({ workspaceFolder: folder }).clear();
}

class NodeDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration) {
    const nodePath = folder && nodePaths.get(folder.uri.toString());
    if (nodePath && !config.runtimeExecutable && !config.runtimeVersion) {
      config.runtimeExecutable = nodePath;
    }
    return config;
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const provider = new NodeDebugConfigurationProvider();
  for (const type of ['node', 'pwa-node']) {
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(type, provider));
  }
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      e.removed.forEach((folder) => unwatch(context, folder));
      e.added.forEach((folder) => watch(context, folder));
    }),
    { dispose: () => watchers.forEach((w) => w.dispose()) },
  );
  await Promise.all((vscode.workspace.workspaceFolders ?? []).map((folder) => watch(context, folder)));
}

export function deactivate() { }
