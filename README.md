# DSLens

> Declarative URL Resolution DSL for structured APIs (JSON, YAML, XML)

![status](https://img.shields.io/badge/status-in--development-orange)
![license](https://img.shields.io/badge/license-MPL%202.0-brightgreen)
![multi-lang](https://img.shields.io/badge/languages-multi--runtime-blue)
![no-scraping](https://img.shields.io/badge/scraping-forbidden-red)
![deterministic](https://img.shields.io/badge/execution-deterministic-success)

---

## 📌 Overview

**DSLens** is a cross-language library that resolves dynamic endpoints declaratively using a navigation DSL over structured remote data.

It is **not a parser in the traditional sense**.  
It is a **deterministic resolver**.

> Think of it as a `querySelector` for APIs — but for JSON, YAML, and XML.

---

## 🎯 Purpose

Enable manifest-driven resolution of dynamic URLs without:

- ❌ HTML parsing
- ❌ scraping
- ❌ heuristic extraction
- ❌ arbitrary code execution

Instead, DSLens provides:

- ✅ Deterministic navigation
- ✅ Declarative expressions
- ✅ Strict read-only resolution
- ✅ Cross-format support (JSON / YAML / XML)

---

## 🧠 Core Concept

```text
${"https://api.example.com/data"}.items[0].download.url
```

This expression:

1. Fetches remote data
2. Navigates the structure
3. Resolves the final value
4. Returns a **string (URL or metadata)**

---

## 🔎 DSL Syntax

### Base Pattern

```text
${"URL"}.path.to.field[index].value
```

### Features

- Dot navigation: `.field`
- Array indexing: `[0]`
- Semantic filters:
  ```text
  [@name="release"]
  ```
- Hybrid metadata:
  ```text
  ".exe,x64 | ${DSL}"
  ```

---

## ⚙️ Resolution Pipeline

1. **Detection**
   - `has_parser_expression()`

2. **Fetch**
   - Remote request
   - Auto-detect: JSON / YAML / XML

3. **Navigation**
   - Deterministic traversal

4. **Conversion**
   - Final output → `string`

5. **Controlled Depth**
   - `MAX_PROFUNDIDADE`
   - `MAX_ENCADEAMENTOS`
   - Timeouts enforced

---

## 🚀 Features

- Deterministic execution (no heuristics)
- Strict idempotent behavior (GET only)
- In-memory caching with TTL
- Cross-language portability
- Fail-safe design (no exception propagation)

---

## 🧱 Constraints (Hard Rules)

- ❌ No HTML parsing
- ❌ No scraping techniques
- ❌ No `eval` / `exec`
- ❌ No uncontrolled chaining
- ❌ No side-effects

---

## 🧯 Error Handling

- Failures return: `None`
- No exceptions leak externally
- Errors are isolated and loggable

---

## 🧠 Cache Model

- Scope: in-memory session cache
- Key: `URL + path`
- TTL: `CACHE_TTL` (default: 60s)

---

## 🌍 Multi-language Implementations

DSLens is designed to be implemented across multiple runtimes:

- Python
- Node.js / JavaScript (browser + server)
- PHP
- Others (Go, Rust, etc.)

Each implementation MUST:

- Preserve deterministic behavior
- Respect constraints and restrictions
- Maintain identical DSL semantics

---

## 📐 Design Principles

- Deterministic > Smart
- Explicit > Implicit
- Declarative > Imperative
- Immutable data flow
- Minimal surface area
- Diff-friendly evolution

---

## 🧪 Example

```text
${"https://api.github.com/repos/user/repo/releases"}
  .assets[@name="app.exe"].browser_download_url
```

---

## 📦 Project Structure (suggested)

```text
dslens/
├── core/
│   ├── resolver
│   ├── fetcher
│   ├── navigator
│   └── cache
│
├── dsl/
│   ├── tokenizer
│   ├── parser
│   └── validator
│
├── adapters/
│   ├── json
│   ├── yaml
│   └── xml
│
└── runtime/
    ├── config
    └── limits
```

---

## 🤝 Contributing

### Requirements

- Follow deterministic design
- No hidden side-effects
- No duplication of logic
- Keep functions small and composable

### Code Style

- Prefer **tab indentation (priority level 2)** where language allows
- Enforce immutability when possible
- Avoid magic values
- Centralize constants

### Commit Guidelines

- Atomic commits
- Clear intent
- Minimal diff surface

---

## 🔒 Security Model

- Read-only operations
- No code execution
- No dynamic evaluation
- Strict input boundaries

---

## 📜 License

This project is licensed under the **Mozilla Public License 2.0 (MPL-2.0)**.

See:
http://mozilla.org/MPL/2.0/

---

## 👤 Author

**JeanCarloEM**  
https://github.com/jcempentools

---

## ⚠️ Status

> This project is under active development.  
> Breaking changes may occur until stabilization.

---

## 🧭 Final Note

DSLens is not trying to be flexible.

It is trying to be **correct, predictable, and safe**.

That is a deliberate constraint.

NOTE: This project is a decoupled component of https://github.com/jcempentools
