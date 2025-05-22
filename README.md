# Tari VS Code Extension

This project implements VS Code extension, which will ease interaction with Tari Ootle.

## Building

First you must install [proto](https://moonrepo.dev/proto) to manage node and pnpm versions.

```shell
proto use
pnpm install
moon tari-extension:build
```

## Running the extension locally

```shell
cd packages/tari-extension
code .
```

Go to "Run and Debug" pane, click on "Run Extension"
