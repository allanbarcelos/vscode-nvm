# vscode-nvm

VS Code extension that uses the node version from your project's `.nvmrc` file, installed with [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows).

## Features

- [x] integrated terminals use the `.nvmrc` node version, in any shell
- [x] tasks and npm scripts run with the correct node version
- [x] the Node.js debugger launches with the correct node version
- [x] multi-root workspaces: each folder uses its own `.nvmrc`
- [x] changes to `.nvmrc` are picked up automatically

The extension prepends the version's `bin` directory to `PATH` in the terminal environment, so it never types commands into your terminals. Terminals that were already open show a warning icon and need to be relaunched to pick up the change.

For debugging, the resolved `node` is used as `runtimeExecutable` for `node` launch configurations that don't set `runtimeExecutable` or `runtimeVersion` themselves.

## Requirements

- nvm (or nvm-windows) installed, with the version from `.nvmrc` installed (`nvm install`)
- a `.nvmrc` file in the root of the workspace folder

The nvm location is read from `NVM_DIR` (default `~/.nvm`) or, on Windows, `NVM_HOME` (default `%APPDATA%\nvm`).

## Example of `.nvmrc` file

```
v20.11.0
```

Partial versions (`20`, `20.11`) resolve to the highest installed match. Aliases such as `lts/*`, `default` or `node` are supported with nvm; nvm-windows has no aliases, so use a version number there.

## Development

```sh
yarn install
yarn compile
yarn test     # compiles, lints and runs the tests inside VS Code
yarn package  # builds the .vsix
```

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).
