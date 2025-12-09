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

# Regular Colors
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
Yellow='\033[0;33m'       # Yellow
Blue='\033[0;34m'         # Blue
Cyan='\033[0;36m'         # Cyan

echo -e "${Blue}Installing bvm (Bun Version Manager)...${Color_Off}"

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
    echo -e "${Red}Error: Unsupported OS: $OS (Actual value: \"$(uname -s)\")${Color_Off}"
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
    echo -e "${Red}Error: Unsupported Architecture: $ARCH${Color_Off}"
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
# Use a more robust JSON parsing for tag_name, requires 'jq'
# Fallback to grep/cut if jq is not available

LATEST_RELEASE_JSON=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest")

if command -v jq >/dev/null 2>&1; then
  LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | jq -r ".tag_name")
else
  # Fallback to grep/cut for basic shell environments if jq is not present
  # This is less robust but works in most cases
  LATEST_TAG=$(echo "$LATEST_RELEASE_JSON" | grep "tag_name" | head -n 1 | cut -d : -f 2- | tr -d \" | tr -d , | tr -d " ")
fi

if [ -z "$LATEST_TAG" ]; then
    echo -e "${Red}Error: Could not fetch the latest release tag from GitHub API. Please check your network or try again.${Color_Off}"
    echo -e "${Yellow}GitHub API response (partial):${Color_Off}"
    echo "$LATEST_RELEASE_JSON" | head -n 5 # Print first 5 lines of API response for debug
    exit 1
fi
echo "Latest tag found: ${Green}${LATEST_TAG}${Color_Off}"

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ASSET_NAME}"

# Installation Directory
BVM_DIR="${HOME}/.bvm"
BIN_DIR="${BVM_DIR}/bin"

# Ensure directories exist
mkdir -p "$BIN_DIR"

echo -e "Detecting platform: ${Green}${PLATFORM} ${ARCH}${Color_Off}"
echo -e "Attempting to download from: ${Yellow}${DOWNLOAD_URL}${Color_Off}"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL" -o "${BIN_DIR}/bvm${EXTENSION}"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "${BIN_DIR}/bvm${EXTENSION}" "$DOWNLOAD_URL"
else
  echo -e "${Red}Error: curl or wget is required to install bvm.${Color_Off}"
  exit 1
fi

chmod +x "${BIN_DIR}/bvm${EXTENSION}"

echo -e "${Green}✓ bvm installed to ${BIN_DIR}/bvm${EXTENSION}${Color_Off}"

# Configure Shell
echo -e "Configuring shell..."
"${BIN_DIR}/bvm${EXTENSION}" setup

echo -e "
${Green}🎉 bvm installed successfully!${Color_Off}"

Please restart your terminal or run the command suggested above to start using bvm.

Then run:
  ${Cyan}bvm install latest${Color_Off}
"
