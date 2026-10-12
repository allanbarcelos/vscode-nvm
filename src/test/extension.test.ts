import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Tests', () => {
  test('extension is registered', () => {
    assert.ok(vscode.extensions.getExtension('allanbarcelos.vscode-nvm'));
  });
});
