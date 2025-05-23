#!/bin/bash
set -e

# Save the workspace root directory
WORKSPACE_ROOT=$(pwd)

TEMP_DIR=$(mktemp -d)

pnpm run build
pnpm pack --pack-destination "$TEMP_DIR"

cd "$TEMP_DIR"
TARBALL=$(ls *.tgz)
tar -xzf "$TARBALL"

cd package
pnpm dlx @vscode/vsce publish -p $VSCE_PAT

cd "$WORKSPACE_ROOT"
rm -rf "$TEMP_DIR"

echo "VS Code extension published successfully!"
