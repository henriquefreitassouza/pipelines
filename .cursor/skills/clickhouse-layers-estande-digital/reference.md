# ClickHouse Cloud MCP — reference links

When extending this skill with data-model notes, document **only** the **`layers_estande_digital`** database unless the project owner expands scope.

## Database `layers_estande_digital` — inventory

**Provenance:** Tables and columns were read from `system.tables`, `system.columns`, and `system.tables.create_table_query` on **2026-04-22** via ClickHouse Cloud MCP (`run_select_query`). **Row and byte totals are a point-in-time snapshot** and will change as data is replicated.

**Discovering schema yourself:** If the MCP `list_tables` tool errors in your client, use qualified `system` queries against `database = 'layers_estande_digital'`, or `SHOW CREATE TABLE layers_estande_digital.<name>`.

### Layout shared by most application tables

Thirteen tables follow the same **PeerDB-style mirrored document** shape (Mongo-like source documents replicated into ClickHouse):

| Column | Type | Role |
|--------|------|------|
| `_id` | `String` | Stable document id from the source system (quoted string form is common). |
| `doc` | `JSON` | Full source document payload; business fields live here. Query with `doc.<path>` or cast as needed. |
| `_peerdb_synced_at` | `DateTime64(9)` | Replication watermark (default `now64()` in DDL). |
| `_peerdb_is_deleted` | `UInt8` | Tombstone / delete flag from replication (`0` = active in samples). |
| `_peerdb_version` | `UInt64` | Version column for `ReplacingMergeTree` deduplication. |

**Engine:** `SharedReplacingMergeTree(..., _peerdb_version)` with **PRIMARY KEY** and **ORDER BY** `_id`, `index_granularity = 8192`. Expect **multiple rows per logical `_id` until merges**; use `FINAL`, `argMax`, or aggregate-by-version patterns when you need a single current row per id.

### Table catalog (alphabetical)

| Table | Engine | `total_rows` (snapshot) | `total_bytes` (snapshot) | Notes |
|-------|--------|-------------------------:|---------------------------:|-------|
| `_peerdb_raw_mirror_fe29c474__8f1b__4c35__b26a__af3c5c233770` | `SharedMergeTree` | 23,064 | ~2.1 MiB | **PeerDB internal** staging/raw mirror (not the denormalized `doc` model). See [PeerDB raw mirror](#peerdb-raw-mirror-table) below. |
| `backofficeEvent` | `SharedReplacingMergeTree` | 389 | ~21 KiB | Back-office / admin **events** tied to the product surface. |
| `bumps` | `SharedReplacingMergeTree` | 7,172 | ~242 KiB | **Bumps** (engagement / signal-style records; name from source model). |
| `coffeeNote` | `SharedReplacingMergeTree` | 2,080 | ~296 KiB | **Coffee notes** (meeting / conversation notes). |
| `event` | `SharedReplacingMergeTree` | 20 | ~2.3 KiB | **Events** (fair or program events). |
| `exhibitor` | `SharedReplacingMergeTree` | 64 | ~4.2 KiB | **Exhibitors**. |
| `feature` | `SharedReplacingMergeTree` | 181 | ~17 KiB | **Features** (product/feature configuration). |
| `lead` | `SharedReplacingMergeTree` | 34,323 | ~2.2 MiB | **Leads**; `doc` holds fields such as `participationId`, `eventRef`, timestamps, optional `profileSlug`. |
| `leadAnswer` | `SharedReplacingMergeTree` | 78,809 | ~1.3 MiB | **Answers** linked to lead flows / forms (`lead` + `question` domain). |
| `leadEvent` | `SharedReplacingMergeTree` | 274,355 | ~13 MiB | **High-volume lead timeline / analytics events** (largest table by bytes in this snapshot). |
| `leadIntent` | `SharedReplacingMergeTree` | 35,798 | ~2.2 MiB | **Lead intents** (intent / funnel signals). |
| `leadsCommissions` | `SharedReplacingMergeTree` | 884 | ~31 KiB | **Commissions** associated with leads. |
| `participation` | `SharedReplacingMergeTree` | 91 | ~9.3 KiB | **Participations** (links profiles/users to events). |
| `question` | `SharedReplacingMergeTree` | 195 | ~17 KiB | **Questions** for lead capture / surveys. |

Domain descriptions in the **Notes** column are **inferred from table names and sample `doc` usage**; treat them as navigation hints until your own data dictionary overrides them.

### PeerDB raw mirror table

`_peerdb_raw_mirror_fe29c474__8f1b__4c35__b26a__af3c5c233770` stores **low-level replication batches**, not business `doc` rows:

| Column | Type |
|--------|------|
| `_peerdb_uid` | `UUID` |
| `_peerdb_timestamp` | `Int64` |
| `_peerdb_destination_table_name` | `String` |
| `_peerdb_data` | `String` |
| `_peerdb_record_type` | `Int32` |
| `_peerdb_match_data` | `String` |
| `_peerdb_batch_id` | `Int64` |
| `_peerdb_unchanged_toast_columns` | `String` |

**Engine:** `SharedMergeTree` ordered by `(_peerdb_batch_id, _peerdb_destination_table_name)`. Prefer the **`doc` tables** above for analytics unless you are debugging replication.

### Working with `doc` (JSON)

- Prefer **`layers_estande_digital.<table>`** qualifiers in every `SELECT`.
- Start exploration with **`SELECT _id, doc FROM layers_estande_digital.<table> WHERE _peerdb_is_deleted = 0 LIMIT 10`** (adjust filters as needed).
- For deduplicated “current” rows, plan for **`ReplacingMergeTree`** semantics (e.g. `FINAL` or `GROUP BY` + `argMax(doc, _peerdb_version)`).

### Business context and Entity-relationship diagram

layers_estande_digital is the database of Estande Digital, a software used at fairs. Exhibitors setup data collection devices such as tablets or barcode scanners inside the booth area and, as visitors are scanned, their data flows through this system. The goal of the software is register visitors to booths and their actions. Inside Estande Digital, exhibitors can register actions and configure properties. Actions can contain additional fields, which allows exhibitors to collect custom data from visitors during specific interactions, such as when the sales team are interacting with a potential customer and they need to register their contact data for a future meeting.

The database is hosted on MongoDB Atlas. The data is then transferred to ClickHouse using a ClickPipe that pulls data every 5 minutes. All ClickPipe tables have a doc column, containing the JSON representation of every document from MongoDB.

Here's the breakdown of all collections and their columns:

- backofficeEvent: register custom actions that the staff can use to register custom interactions with visitors.
- bumps: data from visitors can be transferred between two phones using an "airdrop" feature. Whenever leads are transferred this way, a "bump" is generated and stored in this table.
- coffeeNote: whenever a visitor grabs a cup of coffee, a custom note with information about that visitor is also given, and the generated message is stored in this table.
- event: register the information about the event, fair, convention or the gathering.
- exhibitor: register information about the exhibitor.
- feature: register information about gifts to be handed out at the booth.
- lead: register information about each visitor.
- leadAnswer: register the information collected when the visitor first enters the booth.
- leadEvent: tracks the history of actions performed by each visitor (lead). Actions can be registered by the lead itself, by the system of by staff working at the booth.
- leadIntent: tracks the delivery status of gifts asked at the booth.
- leadsCommissions: register whenever a member of the staff spoke with qualified leads.
- participation: register the signup of exhibitors to events. The participationId key is present in almost every other table.
- question: stores the questions that are asked when visitors first arrive at the booth. Answers are registered inside leadAnswer.

Almost all tables have a participationId key. This key points to the participation table, which is essentially a bridge table between exhibitor and event. Several tables also have leadId, which points to the lead table.

Here's a breakdown of the main tables of this database:

#### lead

- _id: primary key
- eventRef: lead identifier
- interactedWith: array with the e-mails of staff at the booth that engaged with each visitor
- participationId: foreign key to participation
- fields: array of objects containing the data collected across all actions the visitor performed in the booth. Several leadEvent events generate field data, and whenever that's the case, this data is pushed to the array fields in this table.
- createdAt: lead creation date
- updatedAt: lead's last updated date
- profileSlug: lead classification, given after answering the qualification questions when first visiting the booth. Qualification rules are described when registering a new participation.

### leadEvent

- _id: primary key
- key: event internal key
- name: event name
- leadId: visitor that triggered the action
- ref: the source of the event. ref.kind is the kind of source (employee, system, lead. There may be others). ref.id is the identification of the source.
- client: client data from the event, such as the ip address or the browser.
- participationId: foreign key to participation.
- payload: additional data that may be passed to a leadEvent. Not all payloads have the same keys. 
- createdAt: event created date
- updatedAt: event updated date

### participation

- _id: primary key
- active: participation active or not
- eventId: slug of the fair / event / convention
- exhibitorId: foreign key to exhibitor
- eventRefOrigin: type of barcode / qrcode scanner
- icon: display icon
- loadingMessage: display message that will appear at the data collector device
- profiles: array with the names, slugs and colors of each visitor profile

### event

- _id: primary key
- name: name of the event / fair / convention
- event: slug of the event / fair / convention. Same as the eventId at participation

### exhibitor

- _id: primary key
- name: name of the exhibitor
- community: slug of the community. Community is a special identifier that connects to another product and is used to embed the Estande Digital app into this other product.

### question

- _id: primary key
- name: name of the question
- index: position of the question in the form that'll be displayed to each visitor
- participationId: foreign key to participation
- active: question active or not
- options: array of objects containing the label, the slug and the profile slug associated with the question. As visitors answer the questions in the data collection device, their profile slug is set by whichever answers they pick. If a customer fills out the form saying that he/she is a customer, for instance, the profile slug associated with customer will be recorded inside lead and the form will end.

### leadIntent

- _id: primary key
- leadId: foreign key to lead
- featureId: foreign key to feature
- status: delivery status of the gift. This is customizable per feature.
- scanned: whether the visitor's badge was scanned or not, to register that the gift was collected.
- participationId: foreign key to participation.
- uuid: random key for leadIntent
- createdAt: lead intent created date
- updatedAt: lead intent updated date

### feature

- _id: primary key
- metadata: information for how to display the gift option at the presentation screen for visitors to select
- icon: display icon
- active: whether the gift is still being delivered or not. Staff can disable in case the booth ran out of a gift
- index: the order in which this gift will be displayed for end users.
- url: address of the gift
- howToUse: description messages with instructions on how to collect the gift.
- callToAction: technical configuration information
- descriptionByStatus: translated and helpful messages for visitors on status transitions.
- name: gift name
- showQrCode: visitor must present the barcode / qrcode before receiving the gift
- alias: alias that will be recorded in the leadEvent name property when visitors ask for this gift
- defaultDescription: text to be displayed to visitors when seeing this gift option
- cooldownMs: waiting time
- participationId: foreign key to participation

### leadAnswer
- _id: primary key
- leadId: foreign key to lead
- questionId: foreign key to question
- slug: option selected on the data collection device. The option is registed as the slug of the question. This becomes, together with questionId, the composite key to join with question and get the label of the question, containing the prettified name of the answer.
---

## Official documentation

- [MCP overview (ClickHouse Docs)](https://clickhouse.com/docs/use-cases/AI/MCP)
- [Remote MCP in Cloud (features + tool table)](https://clickhouse.com/docs/cloud/features/ai-ml/remote-mcp)
- [Enable and connect remote MCP (setup guide)](https://clickhouse.com/docs/use-cases/AI/MCP/remote_mcp)
- [Open-source MCP server (`mcp-clickhouse`)](https://github.com/ClickHouse/mcp-clickhouse)
- [ClickHouse Agent Skills (optional, schema/query patterns)](https://github.com/ClickHouse/agent-skills)

## Remote MCP factsheet

- **Endpoint**: `https://mcp.clickhouse.cloud/mcp`
- **Auth**: OAuth 2.0 with ClickHouse Cloud credentials; scoped to orgs/services the user can access.
- **Enablement**: per service in Cloud console → **Connect** → **Connect with MCP**.

## Example: VS Code `mcp.json` (HTTP server)

From ClickHouse’s remote MCP setup guide pattern:

```json
{
  "servers": {
    "clickhouse-cloud": {
      "type": "http",
      "url": "https://mcp.clickhouse.cloud/mcp"
    }
  }
}
```

## Example: local `mcp-clickhouse` via `uv` (env only; paths vary)

```json
{
  "mcpServers": {
    "mcp-clickhouse": {
      "command": "uv",
      "args": [
        "run",
        "--with",
        "mcp-clickhouse",
        "--python",
        "3.10",
        "mcp-clickhouse"
      ],
      "env": {
        "CLICKHOUSE_HOST": "<host-from-cloud-console>",
        "CLICKHOUSE_PORT": "8443",
        "CLICKHOUSE_USER": "<user>",
        "CLICKHOUSE_PASSWORD": "<password-or-key>",
        "CLICKHOUSE_SECURE": "true",
        "CLICKHOUSE_VERIFY": "true",
        "CLICKHOUSE_CONNECT_TIMEOUT": "30",
        "CLICKHOUSE_SEND_RECEIVE_TIMEOUT": "30"
      }
    }
  }
}
```

Use the absolute path to `uv` if the IDE cannot resolve `PATH`.
