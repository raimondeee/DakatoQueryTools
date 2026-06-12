# Dakato Query Tools

Internal tool for managing SQL query templates used in [SQLLab](https://superset.a.musta.ch/sqllab/) and [Datako](https://datako.a.musta.ch/).

## Features

- **Query library** — Add, edit, and delete named SQL templates. Formatting (line breaks, indentation) is preserved.
- **Copy to clipboard** — One-click copy for straight queries, or full queries after VALUES substitution.
- **Export / import JSON** — Share query libraries with teammates via JSON files.
- **VALUES helper** — For queries with `{{VALUES_PLACEHOLDER}}`, paste a list of IDs or values and get SQL-formatted `(value, row_num)` pairs. Large lists are automatically chunked (default 1000 per chunk).
- **Default target** — Label queries as SQLLab or Datako, with a quick link to open each tool.

## Getting started

### First-time setup (shared folder)

**Requires [Node.js 18+](https://nodejs.org/)** (includes npm).

From the project folder, run one of:

```bash
./setup.sh          # macOS / Linux
```

```bat
setup.bat           # Windows (double-click or run in Command Prompt)
```

```bash
node setup.mjs      # any platform
npm run setup       # same as above
```

The setup script installs dependencies, creates the `data/` folder, and seeds `data/queries.json` from `data/queries.example.json` if needed.

### Run the app

```bash
npm run dev
```

Open http://localhost:5173

**When sharing this folder:** include `data/queries.example.json` (or an exported JSON file). Each person's `data/queries.json` is local and is not overwritten if it already exists.

## VALUES placeholder

In your SQL, use `{{VALUES_PLACEHOLDER}}` where the dynamic VALUES pairs should go:

```sql
WITH account_list AS (
    SELECT id_account, row_num
    FROM (
        VALUES
            {{VALUES_PLACEHOLDER}}
    ) AS t(id_account, row_num)
)
SELECT ...
```

Paste values into the helper (one per line or comma-separated). The tool assigns row numbers and formats strings vs numbers automatically. Use **Copy query** on each chunk, then paste into [SQLLab](https://superset.a.musta.ch/sqllab/) or [Datako](https://datako.a.musta.ch/).

For **Datako** queries, the main field is **Initial prompt** — use **Copy prompt** and paste into Datako manually. Empty fields show grey placeholder hints only.

## Export / import

Use **Export JSON** / **Import JSON** in the sidebar.

- Export downloads all queries as `dakato-queries-YYYY-MM-DD.json`
- Import asks whether to **replace all** queries or **merge** (add queries with new IDs only)

Share the exported file with teammates; they can import it into their local instance.

## Data storage

Queries are saved to **`data/queries.json`** on your machine (in the project folder). Clearing browser data will not delete them.

On first run after this change, any queries still in browser `localStorage` are migrated automatically into the file.

To back up or share templates, copy `data/queries.json`.
