#!/bin/bash

# BVM Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/bvm/main/install.sh | bash
#   or
#   wget -qO- https://raw.githubusercontent.com/YOUR_USERNAME/bvm/main/install.sh | bash
#

set -e

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

echo -e "${Cyan}
  _                     
 | |                    
 | |__ __   ___ __ ___  
 | '_ \\ \ / / '_ \` _ \
 | |_) \ V /| | | | | |
 |_.__/ \_/ |_| |_| |_|
${Color_Off}
"
echo -e "${Blue}Installing bvm (Bun Version Manager)...${Color_Off}"

# Detect OS and Arch
OS=\"$(uname -s)\"
ARCH=\"$(uname -m)\"

case "$OS" in
  Linux*) # Match Linux and any variants like 'Linux-gnu'
    PLATFORM="linux"
    ;;
  Darwin*) # Match Darwin and any variants
    PLATFORM="darwin"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    PLATFORM="windows"
    ;;
  *)
    echo -e "${Red}Error: Unsupported OS: $OS (Actual value: \"$(uname -s)\")${Color_Off}"
    exit 1
    ;;
esac
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
# Fallback logic for macOS Intel naming if needed (we used darwin-x64)
# Current bvm build output naming:
# bvm-linux-x64
# bvm-darwin-x64
# bvm-darwin-aarch64
# bvm-windows-x64.exe

DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${ASSET_NAME}"

# Installation Directory
BVM_DIR="${HOME}/.bvm"
BIN_DIR="${BVM_DIR}/bin"

# Ensure directories exist
mkdir -p "$BIN_DIR"

echo -e "Detecting platform: ${Green}${PLATFORM} ${ARCH}${Color_Off}"
echo -e "Downloading bvm from: ${Yellow}${DOWNLOAD_URL}${Color_Off}"

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
${Green}🎉 bvm installed successfully!${Color_Off}

Please restart your terminal or run the command suggested above to start using bvm.

Then run:
  ${Cyan}bvm install latest${Color_Off}
"
