# genro-bag-js - Overview e Riferimenti

## Scopo del Progetto

Trasposizione TypeScript/JavaScript del sistema genro-bag Python, mantenendo:
- Stessa architettura (Bag, BagNode, Builder, Compiler)
- Interoperabilità XML/JSON con la versione Python
- Pattern moderni TypeScript (decoratori, tipi strict)

## Architettura Fondamentale

```
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Python)                         │
│                                                                 │
│   Builder Python → crea "ricetta" (Bag strutturata)            │
│   bag.to_xml() → serializza per trasporto                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (HTTP / WebSocket)
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (JavaScript)                     │
│                                                                 │
│   Bag.fromXml() → ricostruisce struttura                       │
│   Expander → espande macro/componenti (opzionale)              │
│   DOMCompiler → costruisce DOM/widget dinamicamente            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Riferimenti Codice

### JavaScript Legacy (Riferimento Funzionale)

Il codice JavaScript esistente di Genropy serve come riferimento funzionale per la trasposizione.

**Cartella sorgente**:
```
/Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/
```

| File | Linee | Descrizione | Rilevanza |
|------|-------|-------------|-----------|
| [`gnrbag.js`](file:///Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/gnrbag.js) | 2577 | Core Bag/BagNode | ⭐⭐⭐ Core |
| [`gnrdomsource.js`](file:///Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/gnrdomsource.js) | 2100 | DOM extensions | ⭐⭐ DOMCompiler |
| [`genro_src.js`](file:///Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/genro_src.js) | 652 | Trigger handlers | ⭐⭐ Pattern |
| [`genro_wdg.js`](file:///Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/genro_wdg.js) | ~1900 | GnrWdgHandler | ⭐⭐⭐ DOM Build |
| [`genro_widgets.js`](file:///Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/genro_widgets.js) | ~4500 | Widget definitions | ⭐⭐⭐ DOM Build |

### Python genro-bag (Architettura di Riferimento)

Il progetto Python genro-bag definisce l'architettura pulita da seguire.

**Repository**:
```
/Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/
```

| File/Cartella | Descrizione |
|---------------|-------------|
| [`src/genro_bag/`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/src/genro_bag/) | Sorgenti Python |
| [`src/genro_bag/bag.py`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/src/genro_bag/bag.py) | Core Bag class |
| [`src/genro_bag/bagnode.py`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/src/genro_bag/bagnode.py) | BagNode class |
| [`src/genro_bag/builder.py`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/src/genro_bag/builder.py) | BagBuilderBase |
| [`src/genro_bag/compiler.py`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/src/genro_bag/compiler.py) | BagCompilerBase (nuovo) |
| [`tests/`](file:///Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/tests/) | Test suite |

---

## Documentazione

### Analisi Dettagliata

- [Analisi Bag JS e Builder JS](analysis/analisi_bag_js_builder_js.md) - Analisi approfondita dell'implementazione JS esistente

### Piano di Implementazione

Vedere il [plan file](file:///Users/gporcari/.claude/plans/streamed-singing-finch.md) per il piano dettagliato.

---

## Mapping Classi

| Python | JavaScript Legacy | TypeScript (nuovo) |
|--------|------------------|-------------------|
| `Bag` | `gnr.GnrBag` | `Bag` |
| `BagNode` | `gnr.GnrBagNode` | `BagNode` |
| `BagBuilderBase` | - | `BagBuilderBase` |
| `BagCompilerBase` | `gnr.GnrWdgHandler` | `BagCompilerBase` |
| `@element` | - | `@element` |
| `@compiler` | widget handlers | `@compiler` |
| `@expander` | - | `@expander` |

---

## Cosa Portare / Cosa NON Portare

### ✅ DA PORTARE (dal Python)
- Architettura pulita Bag/BagNode
- Separazione Builder/Compiler
- Decoratori TypeScript
- Serializzazione XML/JSON compatibile
- Sistema di subscription/trigger

### ❌ DA NON PORTARE (dal JS legacy)
- Dipendenza Dojo
- Stato globale (`genro.*`)
- Concerns misti in singoli file
- Comportamenti impliciti

---

## Quick Links

| Risorsa | Path |
|---------|------|
| **JS Legacy** | `/Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/` |
| **Python genro-bag** | `/Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag/` |
| **Questo progetto** | `/Users/gporcari/Sviluppo/genro_ng/meta-genro-modules/sub-projects/genro-bag-js/` |

---

**Ultimo aggiornamento**: 2025-01-20
