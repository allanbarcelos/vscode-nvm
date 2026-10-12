import * as path from 'path';
import * as vscode from 'vscode';
import { binDir, nodeExecutable, parseNvmrc, resolveVersion } from './nvm';

let nodePath: string | undefined;

async function readNvmrc(folder: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder, '.nvmrc'));
    return parseNvmrc(Buffer.from(bytes).toString('utf8'));
  } catch {
    return undefined;
  }
}

async function apply(context: vscode.ExtensionContext) {
  const env = context.environmentVariableCollection;
  env.clear();
  nodePath = undefined;

  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    return;
  }
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
  nodePath = nodeExecutable(version);
}

class NodeDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(_folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration) {
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
  await apply(context);
}

export function deactivate() { }
