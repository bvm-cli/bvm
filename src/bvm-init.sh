#!/bin/bash

# bvm-init.sh: Initializes bvm default version on shell startup

# Check if BVM_DIR is set
if [ -z "$BVM_DIR" ]; then
  # Attempt to guess BVM_DIR if not set. This might not be reliable.
  # For now, let's assume BVM_DIR is set by the user's rc file.
  return
fi

BVM_ALIAS_DIR="$BVM_DIR/alias"
BVM_BIN_DIR="$BVM_DIR/bin"
BVM_VERSIONS_DIR="$BVM_DIR/versions"

DEFAULT_ALIAS_FILE="$BVM_ALIAS_DIR/default"

if [ -f "$DEFAULT_ALIAS_FILE" ]; then
  DEFAULT_VERSION=$(cat "$DEFAULT_ALIAS_FILE" | tr -d '\n' | tr -d '\r')
  # Check if the default version is actually installed
  if [ -d "$BVM_VERSIONS_DIR/$DEFAULT_VERSION" ]; then
    # Activate the default version by creating a symlink
    # Check if symlink already points to correct version to avoid unnecessary changes
    CURRENT_SYMLINK_TARGET=""
    if [ -L "$BVM_BIN_DIR/bun" ]; then
      CURRENT_SYMLINK_TARGET=$(readlink "$BVM_BIN_DIR/bun")
    fi

    TARGET_EXECUTABLE="$BVM_VERSIONS_DIR/$DEFAULT_VERSION/bun"

    if [ "$CURRENT_SYMLINK_TARGET" != "$TARGET_EXECUTABLE" ]; then
      # Remove existing symlink if it points elsewhere or is broken
      if [ -L "$BVM_BIN_DIR/bun" ] || [ -f "$BVM_BIN_DIR/bun" ]; then
        rm "$BVM_BIN_DIR/bun"
      fi
      ln -s "$TARGET_EXECUTABLE" "$BVM_BIN_DIR/bun"
      # echo "bvm: Activated default Bun $DEFAULT_VERSION" # Optional: add a message
    fi
  fi
fi