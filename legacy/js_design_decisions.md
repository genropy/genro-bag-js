# Decisioni di Design per genro-bag-js

## Premessa

Questo documento raccoglie le decisioni prese sulla progettazione di genro-bag-js, basate sull'analisi del sistema legacy e sulle esigenze del nuovo sistema.

---

## JavaScript vs TypeScript

### Decisione: JavaScript Puro

**Motivazione**: Per una libreria di programmazione generica come Bag, i vantaggi di TypeScript si perdono:

1. **No decoratori** - Non esistono in JavaScript vanilla. I decoratori sono una proposta TC39 Stage 3 che richiede transpilazione
2. **No metodi dunder** - `__getitem__`, `__setitem__` etc. sono specifici di Python
3. **Tipi generici** - Bag contiene "qualsiasi cosa", i tipi diventano `any` ovunque
4. **Overhead** - Toolchain più complesso (tsc, tsconfig, type definitions)

### Conseguenze

- Nessun `.ts` files, solo `.js`
- Nessun `tsconfig.json`
- Build più semplice (o nessun build per dev)
- JSDoc per documentazione tipi (opzionale)

---

## Sistema di Classi

### Decisione: ES6 Classes

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
    // ...
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

### Alternativa Scartata: Factory Functions

```javascript
function createBagNode(tag, value, attr) {
    return {
        _tag: tag,
        get tag() { return this._tag; },
        // ...
    };
}
```

Scartata perché:
- Meno chiara l'ereditarietà
- Più verbosa per getter/setter
- Pattern meno familiare

---

## Sistema Moduli

### Decisione: ESM (ECMAScript Modules)

```javascript
// bag.js
export class Bag { /* ... */ }

// bagnode.js
export class BagNode { /* ... */ }

// index.js
export { Bag } from './bag.js';
export { BagNode } from './bagnode.js';
```

**Motivazione**:
- Standard moderno (parte di ECMAScript)
- Supporto nativo in browser moderni
- Supporto nativo in Node.js 18+
- Tree-shaking possibile con bundler
- Sintassi chiara (`import`/`export`)

### package.json

```json
{
    "type": "module",
    "main": "./src/index.js",
    "exports": {
        ".": "./src/index.js",
        "./bag": "./src/bag.js",
        "./bagnode": "./src/bagnode.js"
    }
}
```

---

## Navigazione Dinamica

### Opzione 1: Metodi Espliciti (Raccomandata)

```javascript
bag.setItem('config.database.host', 'localhost');
const host = bag.getItem('config.database.host');
```

**Pro**:
- Nessuna magia
- Funziona ovunque
- Facile da debuggare
- Chiaro cosa succede

**Contro**:
- Più verboso del Python `bag['path']`

### Opzione 2: Proxy (Valutare)

```javascript
const bag = new Proxy(new Bag(), {
    get(target, prop) {
        if (typeof prop === 'string' && !Reflect.has(target, prop)) {
            return target.getItem(prop);
        }
        return Reflect.get(target, prop);
    },
    set(target, prop, value) {
        if (typeof prop === 'string' && !Reflect.has(target, prop)) {
            target.setItem(prop, value);
            return true;
        }
        return Reflect.set(target, prop, value);
    }
});

bag.config.database.host = 'localhost';  // Funziona!
```

**Pro**:
- Sintassi pulita come Python
- Navigazione naturale

**Contro**:
- Magia nascosta
- Performance overhead
- Confusione tra proprietà e path
- Debug più difficile

### Decisione
Iniziare con **metodi espliciti**. Valutare Proxy come wrapper opzionale in futuro.

---

## Mapping Python → JavaScript

| Python | JavaScript | Note |
|--------|------------|------|
| `bag['path']` | `bag.getItem('path')` | o Proxy |
| `bag['path'] = val` | `bag.setItem('path', val)` | o Proxy |
| `for node in bag` | `for (const node of bag)` | Iterator protocol |
| `len(bag)` | `bag.length` o `bag.size` | Proprietà |
| `'path' in bag` | `bag.has('path')` | Metodo |
| `bag.to_xml()` | `bag.toXml()` | camelCase |
| `bag.to_json()` | `bag.toJson()` | camelCase |
| `Bag.from_xml(s)` | `Bag.fromXml(s)` | Static method |

---

## Serializzazione

### XML
- **Browser**: `DOMParser` (built-in)
- **Node.js**: `fast-xml-parser` o simile (dipendenza)

```javascript
// Browser
const parser = new DOMParser();
const doc = parser.parseFromString(xmlString, 'text/xml');

// Generazione
const serializer = new XMLSerializer();
const xmlString = serializer.serializeToString(doc);
```

### JSON
- Nativo in entrambi gli ambienti

```javascript
const json = JSON.stringify(bag.toJson());
const bag = Bag.fromJson(JSON.parse(jsonString));
```

### Formato Interoperabile
Stesso formato del Python genro-bag per garantire compatibilità:
- XML: stesso schema
- JSON: stessa struttura (lista di nodi)

---

## Test

### Framework: Vitest (o Jest)

```javascript
// bag.test.js
import { describe, it, expect } from 'vitest';
import { Bag } from '../src/bag.js';

describe('Bag', () => {
    it('should create empty bag', () => {
        const bag = new Bag();
        expect(bag.length).toBe(0);
    });

    it('should set and get items', () => {
        const bag = new Bag();
        bag.setItem('foo', 'bar');
        expect(bag.getItem('foo')).toBe('bar');
    });
});
```

---

## Struttura Directory

```
genro-bag-js/
├── src/
│   ├── index.js          # Entry point, exports
│   ├── bag.js            # Bag class
│   ├── bagnode.js        # BagNode class
│   ├── resolver.js       # Resolver system (fase 2)
│   ├── trigger.js        # Trigger/subscription (fase 3)
│   └── serialize/
│       ├── xml.js        # XML parse/serialize
│       └── json.js       # JSON parse/serialize
├── tests/
│   ├── bag.test.js
│   ├── bagnode.test.js
│   └── serialize.test.js
└── package.json
```

---

## Ordine di Implementazione

### Fase 1: Core (Corrente)
1. `BagNode` - nodo singolo con tag, value, attr
2. `Bag` - container con navigazione

### Fase 2: Persistenza
3. `toXml()` / `fromXml()` - serializzazione XML
4. `toJson()` / `fromJson()` - serializzazione JSON

### Fase 3: Resolver
5. `BagResolver` - base class
6. Lazy loading mechanism

### Fase 4: Reattività
7. `Trigger` - sistema eventi
8. `Subscription` - observer pattern

### Fase 5: Builder (Futuro)
9. `BagBuilderBase` - quando serve lato client

---

**Ultimo aggiornamento**: 2025-01-20
