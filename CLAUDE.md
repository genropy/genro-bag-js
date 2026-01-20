# Claude Code Instructions - genro-bag-js

**Parent Document**: This project follows all policies from the central [meta-genro-modules CLAUDE.md](https://github.com/softwellsrl/meta-genro-modules/blob/main/CLAUDE.md)

## Project-Specific Context

### Current Status
- Development Status: Pre-Alpha
- Has Implementation: No (documentation and planning only)

### Project Description

TypeScript/JavaScript port of genro-bag - hierarchical data container with XML serialization, Builder pattern, and Compiler system.

## Architecture Overview

This project replicates the Python genro-bag architecture:

```
genro-bag-js/
├── src/
│   ├── bag.ts              # Core Bag class
│   ├── bagnode.ts          # BagNode class
│   ├── builder.ts          # BagBuilderBase
│   ├── compiler.ts         # BagCompilerBase
│   ├── resolver.ts         # Resolver system
│   ├── decorators/         # @element, @compiler, @expander
│   ├── builders/           # Specialized builders
│   └── compilers/          # Specialized compilers (DOMCompiler)
```

## Key Design Principle

**Server-Side Recipe, Client-Side Build**:

```
Python Server                    JavaScript Browser
─────────────────────────────────────────────────────
Builder Python                   Bag.fromXml()
    │                                │
    ▼                                ▼
bag.to_xml() ──── HTTP ────►    Expander (optional)
                                     │
                                     ▼
                                DOMCompiler
                                     │
                                     ▼
                                DOM/Widgets
```

The Python Builder creates the "recipe" (declarative structure), which is sent to the browser where the JavaScript Compiler builds the actual DOM.

## Reference Implementation

The existing Genropy JavaScript code serves as functional reference:

| File | Purpose | Relevance |
|------|---------|-----------|
| `gnrbag.js` | Core Bag/Node | Core implementation reference |
| `gnrdomsource.js` | DOM extensions | DOMCompiler reference |
| `genro_wdg.js` | Widget handler | DOMCompiler entry point |
| `genro_widgets.js` | Widget definitions | Widget handlers reference |

Location: `/Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/`

## Development Guidelines

### What to Follow (Python genro-bag)
- Clean architecture with separated concerns
- Builder/Compiler separation
- TypeScript decorators for `@element`, `@compiler`, `@expander`
- Modern tooling (ESM, TypeScript strict)

### What NOT to Port (from legacy JS)
- Dojo dependency
- Global state (`genro.*`)
- Mixed concerns in single files
- Implicit behaviors

### XML/JSON Compatibility
- Must produce identical XML format as Python version
- Must produce identical JSON format as Python version
- Cross-language test fixtures for validation

---

**All general policies are inherited from the parent document.**
