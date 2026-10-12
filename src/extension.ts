'use strict';
import * as vscode from 'vscode';

function use(x: vscode.Terminal) {
  var isWin = process.platform === "win32";
  if (isWin) {
    x.sendText(`nvm use $(Get-Content .nvmrc).replace( 'v', '' )`);
  }
  else {
    x.sendText('nvm use');
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.window.terminals.forEach(use);
  context.subscriptions.push(vscode.window.onDidOpenTerminal(use));
}

export function deactivate() { }
