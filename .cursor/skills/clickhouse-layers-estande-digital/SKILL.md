---
name: clickhouse-layers-estande-digital
description: Connects to ClickHouse Cloud through MCP and runs read-only queries scoped to the single database layers_estande_digital (Layers / estande digital). Use when the user mentions layers_estande_digital, that schema’s tables, ClickHouse Cloud, remote MCP, or querying this dataset via MCP tools.
---

# ClickHouse Layers — Estande Digital (MCP)

## Scope (mandatory)

This skill applies **only** to the ClickHouse database **`layers_estande_digital`** (the SQL object namespace many clients call a “schema”).

- Use **`list_tables`** with `database` = **`layers_estande_digital`** only.
- In **`run_select_query`**, qualify every table as **`layers_estande_digital.<table>`** (or set an explicit session context only if the client supports it, still limited to this database).
- Do **not** query, list tables from, or join against **other** databases for routine work under this skill.
- If the user **explicitly** asks to access another database, treat that as **out of scope** for this skill unless they clearly override; then follow their instruction and name the other database in answers.

## Pick an integration

| Path | When to use | Transport | Auth |
|------|-------------|-----------|------|
| **Remote MCP (Cloud)** | ClickHouse Cloud; no local server | HTTPS `https://mcp.clickhouse.cloud/mcp` | OAuth (browser) |
| **mcp-clickhouse (local)** | Any ClickHouse (Cloud or self-hosted); stdio in IDE | Local process | Host, user, password from Cloud |

Default to **Remote MCP** for pure ClickHouse Cloud workflows. Use **mcp-clickhouse** when the user already runs the open-source server or needs direct SQL features from that package.

## Remote MCP (managed)

1. **Enable per service**: ClickHouse Cloud console → open the service → **Connect** → **Connect with MCP** → enable MCP (see [reference.md](reference.md)).
2. **Client URL** (fixed): `https://mcp.clickhouse.cloud/mcp`
3. **Cursor**: install the ClickHouse MCP from the [Cursor Marketplace](https://cursor.com/marketplace), search **ClickHouse**, add server, complete **OAuth** when prompted (per ClickHouse docs).
4. **First connection**: complete OAuth in the browser; access follows the user’s Cloud permissions.

### Agent workflow (remote)

Always **read the MCP tool schema** for the connected server before calling tools (names and parameters differ by client wrapping).

Typical sequence:

1. `get_organizations` → note `organizationId`(s).
2. `get_services_list` with `organizationId` → note target **`serviceId`** (required for data tools).
3. (Optional) `list_databases` with `serviceId` only if needed to confirm **`layers_estande_digital`** exists—do not use this step to browse unrelated databases.
4. `list_tables` with `serviceId`, **`database` = `layers_estande_digital`**, optional `like` / `notLike` filters.
5. `run_select_query` with `serviceId` and a **SELECT-only** `query` that references **`layers_estande_digital`** only.

**Rules**

- Remote tools are **read-only**; do not attempt mutations through MCP.
- Pass **`serviceId`** on every query/schema tool that requires it.
- Prefer small, bounded queries (`LIMIT`, narrow time windows) for exploration.
- Stay within **`layers_estande_digital`** per **Scope** above.

## Local `mcp-clickhouse` (open-source)

Use when the MCP client runs [mcp-clickhouse](https://github.com/ClickHouse/mcp-clickhouse) via `uv` or Python.

**Cloud connection env** (from Cloud **Connect** → native / HTTPS):

- `CLICKHOUSE_HOST` — hostname only (no `https://`).
- `CLICKHOUSE_PORT` — usually `8443` for secure HTTP.
- `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD` — Cloud credentials or key.
- `CLICKHOUSE_SECURE=true`, `CLICKHOUSE_VERIFY=true`.
- Optional: `CLICKHOUSE_ROLE`, timeouts (`CLICKHOUSE_CONNECT_TIMEOUT`, `CLICKHOUSE_SEND_RECEIVE_TIMEOUT`).

**Defaults**

- Assume **read-only** unless the user explicitly needs writes; `CLICKHOUSE_ALLOW_WRITE_ACCESS` defaults false. Never suggest enabling destructive flags unless the user clearly intends DDL/DROP in a safe environment.

**Tool naming**

- The local server’s SQL tool may appear as `run_query` (or similar) depending on version—**list tools and read descriptors** before invoking.

## Quality bar for answers

- State which **organization** and **service** (or host) results apply to when multiple exist.
- For query results, summarize findings and include the **SQL** you relied on when helpful.
- If MCP is disconnected or OAuth incomplete, tell the user to finish connector setup rather than inventing data.

## Further reading

- Curated links and client snippets: [reference.md](reference.md)
