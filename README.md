# DSLens

> Declarative URL Resolution DSL for structured APIs (JSON, YAML, XML)

![status](https://img.shields.io/badge/status-in--development-orange)
![license](https://img.shields.io/badge/license-MPL%202.0-brightgreen)
![multi-lang](https://img.shields.io/badge/languages-multi--runtime-blue)
![deterministic](https://img.shields.io/badge/execution-deterministic-success)
![no-scraping](https://img.shields.io/badge/scraping-forbidden-red)

---

## 📌 Overview

**DSLens** is a **multi-implementation and multi-runtime** library for declarative resolution of dynamic endpoints from remote structured data.

It is not a generic parser.  
It is not a heuristic engine.

It is a **deterministic resolver with strict semantics, portable across languages**.

> Think of it as a `querySelector` for APIs — with identical behavior in any language.

---

## 🎯 Objective

Enable resolution of dynamic URLs via a declarative DSL, eliminating:

- ❌ HTML parsing
- ❌ scraping
- ❌ fragile heuristics
- ❌ arbitrary code execution

And ensuring:

- ✅ absolute determinism
- ✅ idempotency (GET-only)
- ✅ pure declarative navigation
- ✅ cross-language portability

---

## 🌍 Multi-Language Nature (Project Contract)

DSLens is **not just a library** — it is an **implementable specification**.

Each implementation (Python, JS, PHP, etc.) must be considered:

> An _equivalent instance_ of the same logical system.

### Mandatory requirements

All implementations MUST:

- Preserve **identical DSL semantics**
- Produce the **same output for the same input**
- Respect **all constraints (hard rules)**
- Implement the same **resolution pipeline**
- Maintain **deterministic and idempotent** behavior

Any divergence between languages is considered a **contract violation**.

---

## 🧠 Core Concept

```text
${"https://api.example.com/data"}.items[0].download.url
```

**Note:** The content inside `${"..."}`

- may be a URL (default case)
- may be the structured content itself (JSON / YAML / XML)
- may be a path to a local or network file

Supported Quotation Marks:

- The quotation marks can be double quotes (`"`), single quotes (`'`), or backticks (`` ` ``).

Logical pipeline:

1. Remote fetch (when applicable)
2. Structural interpretation (JSON/YAML/XML)
3. Deterministic navigation
4. Mandatory conversion → `string`

---

## 🔎 DSL Syntax

### Base structure

```text
${"SOURCE"}.path.to.field[index].value
```

### Capabilities

- Field navigation: `.field`
- Indexing: `[0]`
- Semantic filters: `[@name="release"]`

---

## ⚙️ Resolution Pipeline (Normative)

1. **Detection**
   - `has_parser_expression`

2. **Fetch**
   - HTTP request (GET only, when applicable)
   - Auto-detect: JSON / YAML / XML

3. **Navigation**
   - Deterministic traversal (no heuristic fallback)

4. **Conversion**
   - Mandatory output: `string`

5. **Execution Control**
   - Limits for:
     - depth (`MAX_DSL_DEPTH`)
     - chaining (`MAX_DSL_CHAINING`)
     - time (`MAX_DSL_RESOLUTION_TIMEOUT`, `MAX_GLOBAL_TIMEOUT`)

---

## 🚀 Features

- Deterministic execution
- No side effects
- In-memory cache with TTL
- Runtime independence
- Fail-safe (no exception propagation)

---

## 🧱 Constraints (Hard Rules)

- ❌ HTML parsing forbidden
- ❌ Scraping forbidden
- ❌ `eval` / `exec` forbidden
- ❌ Heuristic behavior forbidden
- ❌ Side effects forbidden
- ❌ Unlimited chaining forbidden

---

## 🧯 Error Handling

- Default return: `null` / `None`
- No exception must escape
- Errors are isolated and loggable

---

## 🧠 Cache Model

- Scope: session memory
- Key: `URL + path`
- TTL: `CACHE_TTL`

Objective: reduce latency and traffic without compromising determinism.

---

## 📁 Project Structure

```text
/src/
  ├── py/
  │    ├── dsl.py
  │    └── dsl.test.py
  ├── js/
  │    ├── dsl.js
  │    └── dsl.test.js
  ├── ps1/
  │    ├── dsl.ps1
  │    └── dsl.test.ps1
```

### Structural rules

- Each language resides in: `./src/<language>/`

- `<language>` preferably follows the extension (`py`, `js`, `ps1`, etc.), but it is not mandatory

- Minimum structure per implementation:
  - 1 main file (implementation)
  - 1 test file

- Preference for:
  - **single file** containing all logic
  - recommended limit: **≤ 1800 lines (including header)**

- Multiple files are allowed when justifiable

---

## 🧪 Example

```text
${"https://api.github.com/repos/user/repo/releases"}
  .assets[@name="app.exe"].browser_download_url
```

---

## 📐 Design Principles

- Deterministic > Intelligent
- Explicit > Implicit
- Declarative > Imperative
- Immutability by default
- Minimal surface
- Diff-friendly evolution

---

## 🧑‍💻 Implementation Guidelines

### Code

- Indentation: **2 spaces** (when supported)
- Avoid magic values
- Centralize constants
- Small and specialized functions
- No logic duplication

### Architecture

- Low coupling
- High predictability
- Synchronous and controlled flow
- No implicit dependency on external state

---

## 🤝 Contribution

### Requirements

- Preserve DSL semantics
- Do not introduce heuristics
- Do not alter behavior across languages
- Maintain deterministic compatibility

### Commits

- Atomic
- Intentional
- With minimal diffs

---

## 🔒 Security Model

- Read-only operations
- No code execution
- No dynamic evaluation
- Strict input and execution limits

---

## 📜 License

Mozilla Public License 2.0 (MPL-2.0)
http://mozilla.org/MPL/2.0/

---

## 👤 Author

**JeanCarloEM** https://jeancarloem.com.

This project is a segregation from https://github.com/jcempentools, also maintained by **JeanCarloEM** under MPL-2.

---

## ⚠️ Status

Project under active development.
Breaking changes may occur.

---

## 🧭 Final Note

DSLens does not aim to be flexible.

It aims to be:

- predictable
- auditable
- portable
- correct

This rigidity is intentional — and fundamental to the project.
