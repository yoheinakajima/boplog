#!/bin/sh
set -eu

BASE_URL="https://yohei.me"
BIN_DIR="${YOHEI_BIN_DIR:-$HOME/.local/bin}"

mkdir -p "$BIN_DIR"

printf '%s\n' "Installing yohei CLI to $BIN_DIR/yohei"
curl -fsSL "$BASE_URL/yohei" -o "$BIN_DIR/yohei"
chmod +x "$BIN_DIR/yohei"

printf '%s\n' "Installing yohei MCP server to $BIN_DIR/yohei-mcp"
curl -fsSL "$BASE_URL/mcp/yohei_mcp.py" -o "$BIN_DIR/yohei-mcp"
chmod +x "$BIN_DIR/yohei-mcp"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) printf '%s\n' "Add this directory to PATH: $BIN_DIR" ;;
esac

printf '%s\n' "Installed. Try: yohei latest 5"
printf '%s\n' "MCP command: $BIN_DIR/yohei-mcp"
