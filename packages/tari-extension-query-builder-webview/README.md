# Tari Extension Query Builder Webview

---
Last Updated: 2025-06-26
Version: 1.0.0
Verified Against: Current codebase
Implementation: Webview-optimized build of tari-extension-query-builder
---

Webview-optimized build of the Tari Extension Query Builder for integration into VS Code's custom editor interface. This package provides the same visual query building capabilities as the standalone query builder but packaged specifically for VS Code webview contexts.

## Features

- **VS Code Integration**: Optimized for VS Code's webview security constraints
- **Custom Editor Support**: Integrates with VS Code's custom editor API for .tari files
- **Message Passing**: Communicates with VS Code extension through secure message channels
- **Responsive Design**: Adapts to VS Code's theme and layout systems

## Architecture

This package is a specialized build of `tari-extension-query-builder` configured for webview environments:

- **Content Security Policy Compliance**: All scripts and styles follow VS Code's CSP requirements
- **Isolated Context**: Runs in sandboxed webview environment with controlled communication
- **Extension Communication**: Uses VS Code's webview message API for data exchange

## Integration with VS Code Extension

The webview integrates with the main extension through:

1. **Custom Editor Provider**: Registered for `.tari` file types
2. **Message Protocol**: Type-safe communication for queries and results
3. **State Synchronization**: Maintains consistency between editor and webview states
4. **Theme Coordination**: Automatically adapts to VS Code theme changes

## Development

### Building
```bash
pnpm install
pnpm build
```

The build process creates webview-specific assets that are consumed by the main Tari VS Code extension.

### Testing
Testing is handled at the parent query builder level, as this package is primarily a build configuration variant.

## Usage

This package is automatically included when building the main Tari VS Code extension. End users interact with it through:

1. Opening `.tari` files in VS Code
2. Using the custom editor interface
3. Building transaction flows visually
4. Executing transaction plans

The webview provides the same drag-and-drop transaction building capabilities as the standalone query builder but within VS Code's integrated development environment.
