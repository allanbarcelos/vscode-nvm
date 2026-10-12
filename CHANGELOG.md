# Change Log

All notable changes to the "vscode-nvm" extension will be documented in this file.

## 0.1.0

- Set the node version by prepending it to `PATH` for integrated terminals and tasks, instead of typing `nvm use` into them
- Use the `.nvmrc` node for Node.js debug sessions without an explicit `runtimeExecutable` or `runtimeVersion`
- Support partial versions (`20`, `20.11`) and nvm aliases (`lts/*`, `default`, `node`)
- Support Windows through [nvm-windows](https://github.com/coreybutler/nvm-windows), regardless of the shell
- Support multi-root workspaces and reload when `.nvmrc` changes
- Warn when the requested version is not installed

## 0.0.1

- Initial release
