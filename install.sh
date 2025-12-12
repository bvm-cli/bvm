#!/bin/bash

# BVM Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
#   or
#   wget -qO- https://raw.githubusercontent.com/bvm-cli/bvm/main/install.sh | bash
#

set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration ---
# Repo: bvm-cli/bvm
REPO="bvm-cli/bvm" 
# ---------------------

# Reset
Color_Off='\033[0m'       # Text Reset

# Regular Colors (only used if _colorize is active)
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
Yellow='\033[0;33m'       # Yellow
Blue='\033[0;34m'         # Blue
Cyan='\033[0;36m'         # Cyan

# Function to colorize text only if running in a TTY
_colorize() {
  local color="$1"
  local text="$2"
  if [[ -t 1 ]]; then # Check if stdout is a tty
    echo -e "${color}${text}${Color_Off}"
  else
    echo "$text"
  fi
}

# --- Simple Shell Spinner ---
spinner() {
  local pid=$!
  local delay=0.1
  local spinstr='|/-\'
  echo -n " "
  while ps -p $pid > /dev/null; do
    local temp=${spinstr#?}
    printf "\b%c" "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep $delay
  done
  printf "\b "
}

print_logo() {
  local version="$1"
  local start_color=""
  local reset_color=""
  if [[ -t 1 ]]; then
    start_color='\033[36m'
    reset_color='\033[0m'
  fi
  printf "%b" "$start_color"
  cat <<'EOF'
______________   _________   \
\______   \   \ /   /     \  
 |    |  _/\   Y   /  \ /  \ 
 |    |   \ \     /    Y    \
 |______  /  \___/\____|__  /
        \/                \/ 
EOF
  printf "%b" "$reset_color"
  printf "    Bun Version Manager · Built with Bun\n"
  printf "    Version: %s\n\n" "$version"
}

echo "$(_colorize "$Blue" "Installing bvm (Bun Version Manager)...")"

# Detect OS and Arch
OS="$(uname -s)"
ARCH="$(uname -m)"

if [[ "$OS" == "Linux"* ]]; then
    PLATFORM="linux"
elif [[ "$OS" == "Darwin"* ]]; then
    PLATFORM="darwin"
elif [[ "$OS" == "MINGW"* || "$OS" == "MSYS"* || "$OS" == "CYGWIN"* ]]; then
    PLATFORM="windows"
else
    echo "$(_colorize "$Red" "Error: Unsupported OS: $OS (Actual value: \"$(uname -s)\")")"
    exit 1
fi

case "$ARCH" in
  x86_64)
    ARCH="x64"
    ;;
  aarch64|arm64)
    ARCH="aarch64"
    ;;
  *)
    echo "$(_colorize "$Red" "Error: Unsupported Architecture: $ARCH")"
    exit 1
    ;;
esac

if [ "$PLATFORM" == "windows" ]; then
    EXTENSION=".exe"
else
    EXTENSION=""
fi

ASSET_NAME="bvm-${PLATFORM}-${ARCH}${EXTENSION}"

# --- Dynamically get the latest release tag ---
echo "Fetching latest release tag from GitHub API..."

LATEST_RELEASE_JSON=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest")

if command -v jq >/dev/null 2>&1; then
  LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | jq -r ".tag_name")
else
  # Fallback to grep/cut for basic shell environments if jq is not present
  LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | grep "tag_name" | head -n 1 | cut -d : -f 2- | tr -d \" | tr -d , | tr -d " ")
fi

if [ -z "$LATEST_TAG" ]; then
    echo "$(_colorize "$Red" "Error: Could not fetch the latest release tag from GitHub API. Please check your network or try again.")"
    echo "$(_colorize "$Yellow" "GitHub API response (partial):")"
    echo "$LATEST_RELEASE_JSON" | head -n 5 # Print first 5 lines of API response for debug
    exit 1
fi
echo "Latest tag found: $(_colorize "$Green" "$LATEST_TAG")"

print_logo "$LATEST_TAG"

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ASSET_NAME}"

# Installation Directory
BVM_DIR="${HOME}/.bvm"
BIN_DIR="${BVM_DIR}/bin"

# Ensure directories exist
mkdir -p "$BIN_DIR"

TARGET_BIN="${BIN_DIR}/bvm${EXTENSION}"
TEMP_BIN="${TARGET_BIN}.tmp"

if [[ -n "$BVM_INSTALL_SOURCE" ]]; then
  echo "Using local installer binary: $(_colorize "$Yellow" "$BVM_INSTALL_SOURCE")"
  cp "$BVM_INSTALL_SOURCE" "$TEMP_BIN"
else
  echo "Detecting platform: $(_colorize "$Green" "${PLATFORM} ${ARCH}")${Color_Off}"
  echo "Downloading bvm from: $(_colorize "$Yellow" "$DOWNLOAD_URL")"

  # --- Start download with Spinner ---
  if [[ -t 1 ]]; then # If running in a TTY, use spinner
      (
          if command -v curl >/dev/null 2>&1; then
            curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_BIN"
          elif command -v wget >/dev/null 2>&1; then
            wget -qO "$TEMP_BIN" "$DOWNLOAD_URL"
          else
            echo "$(_colorize "$Red" "Error: curl or wget is required to install bvm.")"
            exit 1
          fi
      ) & spinner
  else # If not TTY, just show silent download
      if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_BIN"
      elif command -v wget >/dev/null 2>&1; then
        wget -qO "$TEMP_BIN" "$DOWNLOAD_URL"
      else
        echo "$(_colorize "$Red" "Error: curl or wget is required to install bvm.")"
        exit 1
      fi
  fi
fi

chmod +x "$TEMP_BIN"
mv -f "$TEMP_BIN" "$TARGET_BIN"

echo "$(_colorize "$Green" "✓ bvm installed to ${BIN_DIR}/bvm${EXTENSION}")"

# Configure Shell
echo "Configuring shell via 'bvm setup'..."
"${BIN_DIR}/bvm${EXTENSION}" setup
echo "$(_colorize "$Green" "✓ Shell configured")"

echo ""
echo "$(_colorize "$Green" "🎉 bvm installed successfully!")"
echo ""
echo "Please restart your terminal or run the command suggested above to start using bvm."
echo ""
echo "Then run:"
echo "$(_colorize "$Cyan" "  bvm install latest")"
