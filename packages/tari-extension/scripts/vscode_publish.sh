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
PUBLISH_OUTPUT=$(pnpm dlx @vscode/vsce publish -p $VSCE_PAT 2>&1) || true
if echo "$PUBLISH_OUTPUT" | grep -q "already exists"; then
  echo "Extension with this version already exists. Skipping publish."
else
  if echo "$PUBLISH_OUTPUT" | grep -q "VS Code extension published successfully"; then
    echo "$PUBLISH_OUTPUT"
  else
    echo "$PUBLISH_OUTPUT"
    echo "Publish failed."
    exit 1
  fi
fi

cd "$WORKSPACE_ROOT"
rm -rf "$TEMP_DIR"

echo "VS Code extension published successfully!"
