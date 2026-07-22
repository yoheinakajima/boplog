#!/usr/bin/env python3
"""Dependency-free stdio MCP server for the public yohei.me build archive."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from typing import Any

BASE = "https://yohei.me"
PROTOCOL_VERSION = "2025-11-25"


def fetch_text(path: str) -> str:
    request = urllib.request.Request(f"{BASE}/{path.lstrip('/')}", headers={"User-Agent": "yohei-mcp/1.0"})
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read().decode("utf-8")


def fetch_json(path: str) -> dict[str, Any]:
    return json.loads(fetch_text(path))


def all_projects() -> list[dict[str, Any]]:
    manifest = fetch_json("data/manifest.json")
    rows: list[dict[str, Any]] = []
    for filename in manifest.get("files", []):
        rows.extend(fetch_json(f"data/{filename}").get("projects", []))
    return sorted(rows, key=lambda item: item.get("date", ""), reverse=True)


def search_text(item: dict[str, Any]) -> str:
    return " ".join([
        str(item.get("name", "")),
        str(item.get("displayName", "")),
        str(item.get("description", "")),
        *item.get("categories", []),
        *item.get("formats", []),
        *item.get("types", []),
    ]).lower()


def tool_result(value: Any, is_error: bool = False) -> dict[str, Any]:
    text = value if isinstance(value, str) else json.dumps(value, indent=2, ensure_ascii=False)
    return {"content": [{"type": "text", "text": text}], "isError": is_error}


def tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "latest_builds",
            "title": "Latest public builds",
            "description": "Return Yohei Nakajima's newest explicitly public builds.",
            "inputSchema": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "minimum": 1, "maximum": 100, "default": 10}},
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False},
        },
        {
            "name": "search_builds",
            "title": "Search public builds",
            "description": "Search public builds by text and optionally filter by topic, year, or exact date.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "default": ""},
                    "topic": {"type": "string"},
                    "year": {"type": "integer", "minimum": 2020, "maximum": 2026},
                    "date": {"type": "string", "format": "date"},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 100, "default": 20},
                },
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False},
        },
        {
            "name": "get_build",
            "title": "Get one public build",
            "description": "Return one public build by ID or exact public name.",
            "inputSchema": {
                "type": "object",
                "properties": {"id_or_name": {"type": "string"}},
                "required": ["id_or_name"],
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True, "destructiveHint": False, "idempotentHint": True, "openWorldHint": False},
        },
    ]


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    rows = all_projects()
    if name == "latest_builds":
        limit = max(1, min(int(arguments.get("limit", 10)), 100))
        return tool_result(rows[:limit])

    if name == "search_builds":
        query = str(arguments.get("query", "")).lower().strip()
        topic = arguments.get("topic")
        year = arguments.get("year")
        date = arguments.get("date")
        limit = max(1, min(int(arguments.get("limit", 20)), 100))
        selected = []
        for item in rows:
            if query and query not in search_text(item):
                continue
            if topic and topic not in item.get("categories", []):
                continue
            if year and not item.get("date", "").startswith(str(year)):
                continue
            if date and item.get("date") != date:
                continue
            selected.append(item)
        return tool_result(selected[:limit])

    if name == "get_build":
        needle = str(arguments.get("id_or_name", "")).lower().strip()
        for item in rows:
            candidates = [item.get("id", ""), item.get("name", ""), item.get("displayName", "")]
            if any(str(candidate).lower() == needle for candidate in candidates):
                return tool_result(item)
        return tool_result(f"No public build matched: {needle}", True)

    raise ValueError(f"Unknown tool: {name}")


def respond(request_id: Any, result: Any = None, error: dict[str, Any] | None = None) -> None:
    message: dict[str, Any] = {"jsonrpc": "2.0", "id": request_id}
    if error is not None:
        message["error"] = error
    else:
        message["result"] = result
    sys.stdout.write(json.dumps(message, separators=(",", ":"), ensure_ascii=False) + "\n")
    sys.stdout.flush()


def handle(message: dict[str, Any]) -> None:
    method = message.get("method")
    request_id = message.get("id")
    params = message.get("params") or {}

    if method == "notifications/initialized":
        return
    if method == "initialize":
        respond(request_id, {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"tools": {}, "resources": {}},
            "serverInfo": {"name": "yohei.me-public-builds", "version": "1.0.0", "description": "Read-only access to Yohei Nakajima's public build archive."},
        })
        return
    if method == "ping":
        respond(request_id, {})
        return
    if method == "tools/list":
        respond(request_id, {"tools": tools()})
        return
    if method == "tools/call":
        try:
            respond(request_id, call_tool(str(params.get("name", "")), params.get("arguments") or {}))
        except (ValueError, TypeError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            respond(request_id, tool_result(str(exc), True))
        return
    if method == "resources/list":
        respond(request_id, {"resources": [
            {"uri": "https://yohei.me/data/manifest.json", "name": "Public project manifest", "mimeType": "application/json"},
            {"uri": "https://yohei.me/llms.txt", "name": "AI-readable site guide", "mimeType": "text/plain"},
            {"uri": "https://yohei.me/agents.md", "name": "Agent usage guide", "mimeType": "text/markdown"},
        ]})
        return
    if method == "resources/read":
        uri = str(params.get("uri", ""))
        allowed = {
            "https://yohei.me/data/manifest.json": "data/manifest.json",
            "https://yohei.me/llms.txt": "llms.txt",
            "https://yohei.me/agents.md": "agents.md",
        }
        if uri not in allowed:
            respond(request_id, error={"code": -32602, "message": "Unknown or disallowed resource URI"})
            return
        try:
            text = fetch_text(allowed[uri])
            mime = "application/json" if uri.endswith(".json") else "text/plain"
            respond(request_id, {"contents": [{"uri": uri, "mimeType": mime, "text": text}]})
        except (urllib.error.URLError, TimeoutError) as exc:
            respond(request_id, error={"code": -32603, "message": str(exc)})
        return

    if request_id is not None:
        respond(request_id, error={"code": -32601, "message": f"Method not found: {method}"})


def main() -> int:
    for line in sys.stdin:
        try:
            message = json.loads(line)
            if isinstance(message, dict):
                handle(message)
        except json.JSONDecodeError as exc:
            respond(None, error={"code": -32700, "message": f"Parse error: {exc}"})
        except Exception as exc:  # keep the stdio server alive and return protocol-safe errors
            respond(None, error={"code": -32603, "message": str(exc)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
