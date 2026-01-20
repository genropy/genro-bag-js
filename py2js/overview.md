# Python to JavaScript Porting - Decisioni

## Decisione Fondamentale: JavaScript Puro (NO TypeScript)

**Motivazione**: Per una libreria di programmazione generica come Bag, i vantaggi di TypeScript si perdono:

1. **No decoratori nativi** - I decoratori sono una proposta TC39 Stage 3, richiedono transpilazione
2. **No metodi dunder** - `__getitem__`, `__setitem__` sono specifici Python
3. **Tipi generici inutili** - Bag contiene "qualsiasi cosa", i tipi diventano `any` ovunque
4. **Overhead toolchain** - tsc, tsconfig, type definitions aggiungono complessità

### Conseguenze

- Solo file `.js` (nessun `.ts`)
- Nessun `tsconfig.json`
- Build più semplice (o nessun build per dev)
- JSDoc per documentazione tipi (opzionale)

---

## Sistema di Classi: ES6 Classes

```javascript
class BagNode {
    constructor(tag, value = null, attr = {}) {
        this._tag = tag;
        this._value = value;
        this._attr = attr;
        this._parent = null;
    }

    get tag() { return this._tag; }
    get value() { return this._value; }
}

class Bag {
    constructor() {
        this._nodes = new Map();
    }

    setItem(path, value, attr = {}) { /* ... */ }
    getItem(path) { /* ... */ }
}
```

**Motivazione**:
- Sintassi più vicina a Python
- Getter/setter nativi per proprietà
- Ereditarietà chiara
- Familiarità per sviluppatori Python

---

## Sistema Moduli: ESM

```javascript
// bag.js
export class Bag { /* ... */ }

// index.js
export { Bag } from './bag.js';
export { BagNode } from './bagnode.js';
```

**Motivazione**:
- Standard moderno (ECMAScript)
- Supporto nativo browser moderni
- Supporto nativo Node.js 18+
- Tree-shaking possibile

---

## Navigazione: Metodi Espliciti

```javascript
bag.setItem('config.database.host', 'localhost');
const host = bag.getItem('config.database.host');
```

**Pro**: Nessuna magia, facile debug, funziona ovunque
**Contro**: Più verboso del Python `bag['path']`

**Proxy opzionale in futuro** per sintassi più pulita.

---

## Mapping Python → JavaScript

| Python | JavaScript | Note |
|--------|------------|------|
| `bag['path']` | `bag.getItem('path')` | o Proxy |
| `bag['path'] = val` | `bag.setItem('path', val)` | o Proxy |
| `for node in bag` | `for (const node of bag)` | Iterator |
| `len(bag)` | `bag.length` | Proprietà |
| `'path' in bag` | `bag.has('path')` | Metodo |
| `bag.to_xml()` | `bag.toXml()` | camelCase |
| `Bag.from_xml(s)` | `Bag.fromXml(s)` | Static |

---

## Serializzazione

### XML
- **Browser**: `DOMParser` (built-in)
- **Node.js**: `fast-xml-parser` o simile

### JSON
- Nativo in entrambi gli ambienti
- Stesso formato del Python genro-bag

---

## Ordine di Implementazione

1. **Core**: `BagNode` + `Bag` con navigazione
2. **Persistenza**: `toXml()`, `fromXml()`, `toJson()`, `fromJson()`
3. **Resolver**: Lazy loading
4. **Reattività**: Trigger/Subscription
5. **Builder**: Ultimo (set aside per ora)

---

## Interoperabilità

Stesso formato XML/JSON della versione Python per garantire:
- Server Python → Browser JS
- Fixture di test condivise
- Migrazione graduale

---

## Flusso Completo: Server → Browser

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Python/ASGI)                              │
│                                                                             │
│  1. Request HTTP: GET /app/mypage                                           │
│                                                                             │
│  2. Costruisci configurazione pagina:                                       │
│     - titolo, CSS, JS files                                                 │
│     - genro_config (start_args, user info, etc.)                            │
│                                                                             │
│  3. HtmlBuilder genera bootstrap HTML:                                      │
│     - <head> con meta, CSS links                                            │
│     - <body> con div#root + script tags                                     │
│     - window.GENRO_CONFIG = {...}                                           │
│                                                                             │
│  4. Response HTML                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BROWSER (JavaScript)                              │
│                                                                             │
│  5. Parse HTML, carica CSS                                                  │
│                                                                             │
│  6. Carica JS bundle (genro-bag-js + app code)                              │
│                                                                             │
│  7. genro.start(window.GENRO_CONFIG)                                        │
│     - Inizializza Bag client-side                                           │
│     - Setup connessioni (WebSocket?)                                        │
│                                                                             │
│  8. Fetch "ricetta" UI dal server:                                          │
│     GET /app/mypage/_recipe → Bag XML/JSON                                  │
│                                                                             │
│  9. Deserializza: Bag.fromXml(response) → Bag JS                            │
│                                                                             │
│  10. Compile/Render:                                                        │
│      - Expand (se ci sono macro)                                            │
│      - Compile → DOM elements                                               │
│      - Mount nel div#root                                                   │
│                                                                             │
│  11. Event loop:                                                            │
│      - User interactions → trigger/subscription                             │
│      - Server updates → Bag mutations → DOM updates                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Responsabilità

| Componente | Responsabilità |
|------------|----------------|
| **Server Python** | Genera bootstrap HTML, serve ricette Bag, gestisce logica business |
| **HtmlBuilder** | Costruisce pagina bootstrap (sostituisce Mako) |
| **genro-bag-js** | Deserializza Bag, compila UI, gestisce reattività |
| **Browser** | Esegue JS, renderizza DOM, gestisce eventi utente |

### Ruolo di genro-bag-js

**SI occupa di**:
- Ricevere configurazione dal bootstrap
- Fetch ricetta (Bag serializzata)
- Deserializzare XML/JSON → Bag JS
- Expand (macro/expander)
- Compile → costruire/attivare DOM
- Gestire eventi e aggiornamenti dinamici

**NON si occupa di**:
- Generare la pagina bootstrap (fatto da Python)
- Minificazione JS (fatto dal server in produzione)
- Routing HTTP (fatto dal server)
- Logica business (server-side)

---

## Bootstrap Page Legacy (Riferimento)

La pagina di bootstrap legacy era XHTML 1.0 Strict con Dojo:

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="chrome=1">

    <!-- Mobile meta tags -->
    <meta name="mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="black"/>
    <meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"/>

    <!-- Dojo toolkit -->
    <script type="text/javascript" src="/_dojo/11/dojo/dojo/dojo.js"
            djConfig="parseOnLoad: false, isDebug: false, locale: 'it-it', noFirebugLite:true"></script>
    <script type="text/javascript">dojo.registerModulePath('gnr','/_gnr/11/');</script>
    ...
  </head>
</html>
```

### Evoluzione proposta

Sostituire Mako templates con **HtmlBuilder** Python:

```python
from genro_bag import Bag
from genro_bag.builders.html import HtmlBuilder

def build_bootstrap_page(config: dict) -> str:
    page = Bag(builder=HtmlBuilder)

    html = page.html(lang='it')
    head = html.head()
    head.meta(charset='utf-8')
    head.title(config['title'])

    for css in config['css_files']:
        head.link(rel='stylesheet', href=css)

    body = html.body()
    body.div(id='main_root')

    for js in config['js_files']:
        body.script(src=js)

    body.script(f"genro.start({json.dumps(config['genro_config'])});")

    return page.compile()
```

---

**Ultimo aggiornamento**: 2025-01-20
