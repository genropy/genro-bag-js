# Analisi Bag JS e Builder JS

**Status**: 🔴 DA REVISIONARE
**Data**: 2026-01-20
**Fonte**: `/Users/gporcari/Sviluppo/Genropy/genropy/gnrjs/gnr_d11/js/`

---

## 0. Concetto Fondamentale: Ricetta Python → Build Browser

**PRINCIPIO CHIAVE**: Il Builder Python è propedeutico - crea la "ricetta" dichiarativa che viene poi eseguita nel browser.

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Python)                            │
│                                                                 │
│   Builder Python → definisce la "ricetta" (Bag strutturata)    │
│                                                                 │
│   bag.to_xml() o bag.to_json() → serializza per trasporto      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  (HTTP / WebSocket)
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (JavaScript)                       │
│                                                                 │
│   Bag.fromXml() → ricostruisce la struttura                    │
│                              │                                  │
│                              ▼                                  │
│   Expander (opzionale) → espande macro/componenti              │
│                              │                                  │
│                              ▼                                  │
│   DOMCompiler → costruisce DOM/widget dinamicamente            │
│       │                                                         │
│       ├─► GnrWdgHandler.create()                               │
│       └─► gnr.widgets.* (handler per ogni tag)                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implicazioni**:

1. **Builder Python** = definisce COSA (struttura dichiarativa)
2. **Expander JS** = espande macro se necessario
3. **DOMCompiler JS** = costruisce COME (DOM reale)

Il lavoro nel Builder Python è **propedeutico**: prepara la ricetta che il browser eseguirà. La costruzione dinamica del DOM avviene lato client con Expander e Compiler JavaScript.

---

## 1. Panoramica Architetturale

Il sistema JavaScript esistente è composto da tre livelli principali:

```
┌─────────────────────────────────────────────────────────────┐
│                    gnr.GnrSrcHandler                        │
│            (Gestione trigger DOM, orchestrazione)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  gnr.GnrDomSource          │  gnr.GnrDomSourceNode          │
│  (extends GnrBag)          │  (extends GnrBagNode)          │
│  - Fluent API _()          │  - build() DOM                 │
│  - Datapath resolution     │  - Widget integration          │
│  - Two-way binding         │  - Dynamic attributes          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  gnr.GnrBag                 │  gnr.GnrBagNode               │
│  - _nodes array             │  - label, value, attr         │
│  - Subscription system      │  - Resolver support           │
│  - Trigger system           │  - Parent/child navigation    │
│  - XML serialization        │  - getValue/setValue          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. gnrbag.js - Core Classes

### 2.1 GnrBagNode

**File**: `gnrbag.js` linee 1-800 circa

```javascript
dojo.declare("gnr.GnrBagNode", null, {
    constructor: function(parentBag, label, value, attr, resolver, position) {
        this._parentBag = parentBag;
        this._value = value;
        this._resolver = resolver;
        this.label = label;
        this.attr = attr || {};
        // ...
    }
});
```

**Proprietà chiave**:
| Proprietà | Tipo | Descrizione |
|-----------|------|-------------|
| `_parentBag` | GnrBag | Riferimento al contenitore padre |
| `_value` | any | Valore del nodo (può essere GnrBag per sotto-strutture) |
| `_resolver` | GnrBagResolver | Lazy loading (opzionale) |
| `label` | string | Nome/etichetta del nodo |
| `attr` | object | Attributi del nodo |
| `_parentBagIndex` | number | Posizione nell'array `_nodes` del padre |

**Metodi principali**:

| Metodo | Descrizione | Note per Python |
|--------|-------------|-----------------|
| `getValue()` | Ottiene valore, risolve resolver se necessario | ✅ Già in Python |
| `setValue(value)` | Imposta valore, triggera eventi | ✅ Già in Python |
| `getAttr(name, dflt)` | Ottiene attributo | ✅ Già in Python |
| `setAttr(attr, value, trigger)` | Imposta attributo, triggera | ✅ Già in Python |
| `getParentBag()` | Ritorna `_parentBag` | ✅ Già in Python |
| `getParentNode()` | Ritorna nodo padre del `_parentBag` | ✅ Già in Python |
| `getFullpath(from, omitLastLabel)` | Path completo dalla root | ✅ `fullpath` property |
| `getResolver()` | Ritorna resolver | ✅ Già in Python |
| `setResolver(resolver)` | Imposta resolver | ✅ Già in Python |

**Resolver pattern**:
```javascript
getValue: function() {
    if (this._resolver && !this._resolver.expired()) {
        return this._value;
    }
    if (this._resolver) {
        this._value = this._resolver.resolve();
        // ...
    }
    return this._value;
}
```

### 2.2 GnrBag

**File**: `gnrbag.js` linee 800-2000 circa

```javascript
dojo.declare("gnr.GnrBag", null, {
    constructor: function(source) {
        this._nodes = [];
        this._backref = {};
        this._node = null;      // Nodo che contiene questa Bag
        this._resolver = null;
        this._subscribers = {};
        // ...
    }
});
```

**Proprietà chiave**:
| Proprietà | Tipo | Descrizione |
|-----------|------|-------------|
| `_nodes` | Array | Lista ordinata di GnrBagNode |
| `_backref` | Object | Mappa label → indice per accesso O(1) |
| `_node` | GnrBagNode | Nodo contenitore (parent) |
| `_subscribers` | Object | Sottoscrizioni per eventi |
| `_resolver` | GnrBagResolver | Resolver a livello di Bag |

**Metodi di accesso**:

| Metodo | Signature | Note |
|--------|-----------|------|
| `getItem(path)` | `getItem(path, dflt)` | Accesso per path, supporta `?`, `#` |
| `setItem(path, value, attr, kwargs)` | Complesso | Crea path se non esiste |
| `getNode(path)` | `getNode(path)` | Ritorna BagNode, non valore |
| `getNodes()` | `getNodes()` | Ritorna copia di `_nodes` |
| `delNode(node)` | `delNode(node)` | Rimuove e triggera |
| `popNode(path)` | `popNode(path)` | Rimuove e ritorna nodo |

**Path syntax speciale**:
```javascript
// Wildcards
bag.getItem('users.?name=admin')   // Cerca per attributo
bag.getItem('config.#0')            // Accesso per indice

// Path resolution
bag.getItem('parent.child.value')   // Traversal puntato
```

**Sistema di Subscription**:
```javascript
subscribe: function(subscriberId, kwargs) {
    // kwargs: {any: fn, ins: fn, upd: fn, del: fn}
    this._subscribers[subscriberId] = kwargs;
}

onNodeTrigger: function(triggerPars) {
    // Propaga eventi ai subscriber
    for (var subscriberId in this._subscribers) {
        var subscriber = this._subscribers[subscriberId];
        if (subscriber.any) subscriber.any(triggerPars);
        // ... ins, upd, del specifici
    }
    // Propaga al parent
    if (this._node) {
        this._node._parentBag.onNodeTrigger(triggerPars);
    }
}
```

**Serializzazione XML**:
```javascript
toXml: function(kwargs) {
    // Genera stringa XML dalla struttura
    var result = [];
    this.forEach(function(node) {
        result.push(node.toXml());
    });
    return result.join('');
}

fromXmlDoc: function(sourceNode, resolver_kwargs) {
    // Parsing da DOM XML
}
```

### 2.3 GnrBagResolver

**File**: `gnrbag.js` linee 2000-2200 circa

```javascript
dojo.declare("gnr.GnrBagResolver", null, {
    constructor: function(kwargs) {
        this._kwargs = kwargs || {};
        this._cacheTime = kwargs.cacheTime;  // -1 = never expire
        this._onResolve = kwargs.onResolve;
        // ...
    },

    expired: function() {
        if (this._cacheTime === -1) return false;
        if (this._cacheTime === 0) return true;
        return (new Date() - this._resolveTime) > this._cacheTime * 1000;
    },

    resolve: function() {
        // Override in subclasses
        this._resolveTime = new Date();
        return this._kwargs.data;
    }
});
```

**Sottoclassi**:
- `GnrBagCbResolver` - Risoluzione tramite callback
- `GnrBagFormula` - Risoluzione tramite formula/espressione

---

## 3. gnrdomsource.js - DOM Integration

### 3.1 GnrDomSourceNode

**File**: `gnrdomsource.js` linee 1-1000 circa

Estende `GnrBagNode` con capacità DOM:

```javascript
dojo.declare("gnr.GnrDomSourceNode", gnr.GnrBagNode, {
    // Costruttore eredita da GnrBagNode

    build: function(destinationNode, ind) {
        // Costruisce widget/DOM dal nodo
        this._doBuildNode(destinationNode, ind);
    },

    _doBuildNode: function(where, ind) {
        var tag = this.attr.tag;
        var handler = genro.src.tagHandlers[tag];
        if (handler) {
            handler.call(this, where, ind);
        } else {
            // Default widget creation
            this._createWidget(where, ind);
        }
    }
});
```

**Metodi DOM-specifici**:

| Metodo | Descrizione | Rilevanza per Compiler |
|--------|-------------|------------------------|
| `build(dest, ind)` | Costruisce DOM/widget | ⭐ Core del DOMCompiler |
| `rebuild()` | Ricostruisce preservando stato | ⭐ Hot reload |
| `getWidget()` | Ritorna widget Dojo associato | Widget integration |
| `getDomNode()` | Ritorna elemento DOM | DOM access |
| `destroy()` | Distrugge widget e DOM | Cleanup |

**Dynamic Attributes**:
```javascript
_setDynAttributes: function() {
    // Attributi che si aggiornano quando cambiano i dati
    if (this._dynattr) {
        for (var attrname in this._dynattr) {
            var datapath = this._dynattr[attrname];
            var value = this.getRelativeData(datapath);
            this.setAttr(attrname, value, false);
        }
    }
}

registerDynAttr: function(attrname, datapath) {
    this._dynattr = this._dynattr || {};
    this._dynattr[attrname] = datapath;
}
```

**Datapath Resolution**:
```javascript
absDatapath: function(relpath) {
    // Converte path relativo in assoluto
    var nodeDatapath = this.attr.datapath;
    if (relpath.startsWith('^')) {
        // Path relativo al datapath del nodo
        return this._resolveCaretPath(relpath);
    }
    // ... altre logiche
}

getRelativeData: function(path, dflt) {
    var abspath = this.absDatapath(path);
    return genro.getData(abspath, dflt);
}

setRelativeData: function(path, value, attr, kwargs) {
    var abspath = this.absDatapath(path);
    genro.setData(abspath, value, attr, kwargs);
}
```

### 3.2 GnrDomSource

**File**: `gnrdomsource.js` linee 1000-2100 circa

Estende `GnrBag` con:

```javascript
dojo.declare("gnr.GnrDomSource", gnr.GnrBag, {
    nodeFactory: function() {
        return new gnr.GnrDomSourceNode(/*...*/);
    },

    // Fluent API per costruzione strutture
    _: function(tag, value, attr) {
        // Crea nodo figlio e ritorna il suo valore (Bag)
        // per permettere chaining
        var node = this.setItem(/*...*/);
        return node.getValue();
    }
});
```

**Fluent API**:
```javascript
// Uso tipico
var src = new gnr.GnrDomSource();
src._('div', null, {id: 'container'})
   ._('span', 'Hello', {class: 'greeting'})
   ._('button', 'Click', {onclick: handler});
```

---

## 4. genro_src.js - Source Handler

### 4.1 GnrSrcHandler

**File**: `genro_src.js`

Gestisce la sincronizzazione Bag → DOM:

```javascript
dojo.declare("gnr.GnrSrcHandler", null, {
    constructor: function() {
        this.tagHandlers = {};  // Registrazione handler per tag
    },

    // Trigger handlers
    _trigger_ins: function(node, evt) {
        // Quando un nodo viene inserito nella Bag
        // → Costruisce il DOM corrispondente
        node.build(parentDomNode);
    },

    _trigger_upd: function(node, evt) {
        // Quando un nodo viene aggiornato
        // → Aggiorna il DOM/widget
        node.rebuild();
    },

    _trigger_del: function(node, evt) {
        // Quando un nodo viene rimosso
        // → Distrugge il DOM/widget
        node.destroy();
    }
});
```

---

## 5. genro_wdg.js e genro_widgets.js - Il Cuore del DOM Build

**FONDAMENTALE**: Questi due file sono la **base del sistema di build del DOM**.

### 5.1 genro_wdg.js - Widget Handler

**File**: `genro_wdg.js` (~1900 linee)

Contiene `GnrWdgHandler` - il gestore centrale per la creazione di widget:

```javascript
dojo.declare("gnr.GnrWdgHandler", null, {
    constructor: function(application) {
        this.application = application;
        this.catalog = new gnr.GnrBag();
        this.namespace = {};      // Mapping tag → [namespace, tag]
        this.widgets = {};        // Handler istanziati
        this.widgetcatalog = {};  // Mapping widget → dojo require

        // Registra tutti i tag HTML
        var htmlspace = ['div', 'span', 'table', 'tr', 'td', ...];
        for (let tag of htmlspace) {
            this.namespace[tag.toLowerCase()] = ['html', tag];
        }

        // Registra widget Dojo
        this.widgetcatalog = {
            'CheckBox': 'dijit.form.CheckBox',
            'TextBox': 'dijit.form.TextBox',
            'BorderContainer': 'dijit.layout.BorderContainer',
            // ... tutti i widget Dojo
        };
    }
});
```

**Metodi chiave**:

| Metodo | Descrizione | Ruolo nel Compiler |
|--------|-------------|-------------------|
| `create(tag, dest, attr, ind, srcNode)` | **ENTRY POINT** - Crea widget/DOM | ⭐⭐⭐ Core |
| `getHandler(tag)` | Trova handler per tag | Dispatch |
| `makeDomNode(tag, dest, ind)` | Crea elemento DOM | HTML creation |
| `createHtmlElement(...)` | Costruisce elemento HTML | HTML widget |
| `createDojoWidget(...)` | Costruisce widget Dojo | Dojo widget |
| `linkSourceNode(obj, srcNode)` | Collega widget ↔ sourceNode | Binding |

**Il metodo `create()` - Il cuore del build**:

```javascript
create: function(tag, destination, attributes, ind, sourceNode) {
    // 1. Trova handler per questo tag
    var handler = this.getHandler(tag);

    // 2. Pre-creation hook
    if (handler._beforeCreation) {
        handler._beforeCreation(attributes, sourceNode);
    }

    // 3. Determina domtag
    domtag = handler._domtag || tag;

    // 4. Crea elemento DOM
    if (domtag != '*') {
        domnode = this.makeDomNode(domtag, destination, ind);
    }

    // 5. Chiama _creating per preparare attributi
    var kw = {
        'postCreation': handler._creating(attributes, sourceNode),
        // ...
    };

    // 6. Crea oggetto (HTML o Dojo widget)
    if (!handler._dojowidget) {
        newobj = this.createHtmlElement(domnode, attributes, kw, sourceNode);
    } else {
        newobj = this.createDojoWidget(tag, domnode, attributes, kw, sourceNode);
    }

    // 7. Collega sourceNode
    this.linkSourceNode(newobj, sourceNode, kw);

    // 8. Post-creation hook
    handler._created(newobj, kw.postCreation, sourceNode, ind);

    return newobj;
}
```

### 5.2 genro_widgets.js - Widget Definitions

**File**: `genro_widgets.js` (~4500 linee)

Contiene **tutti** i widget handler organizzati gerarchicamente:

```
gnr.widgets.baseHtml          ← Base per elementi HTML
    ├── gnr.widgets.htmliframe
    ├── gnr.widgets.flexbox
    ├── gnr.widgets.gridbox
    ├── gnr.widgets.labledbox
    ├── gnr.widgets.canvas
    ├── gnr.widgets.video
    └── gnr.widgets.LightButton

gnr.widgets.baseDojo          ← Base per widget Dojo
    ├── gnr.widgets.Dialog
    ├── gnr.widgets.Editor
    ├── gnr.widgets.ProgressBar
    ├── gnr.widgets.StackContainer
    │   └── gnr.widgets.TabContainer
    ├── gnr.widgets.BorderContainer
    ├── gnr.widgets.TitlePane
    ├── gnr.widgets.ContentPane
    ├── gnr.widgets.Menu
    ├── gnr.widgets.Button
    ├── gnr.widgets.CheckBox
    ├── gnr.widgets._BaseTextBox
    │   ├── gnr.widgets.TextBox
    │   ├── gnr.widgets.DateTextBox
    │   ├── gnr.widgets.TimeTextBox
    │   └── gnr.widgets.NumberTextBox
    └── gnr.widgets.BaseCombo
        └── gnr.widgets.FilteringSelect
```

**Struttura di un widget handler**:

```javascript
dojo.declare("gnr.widgets.baseHtml", null, {
    _defaultValue: '',
    _defaultEvent: 'onclick',

    constructor: function() {
        this._domtag = null;      // Tag DOM da creare (null = usa tag originale)
        this._dojotag = null;     // Tag Dojo alternativo
        this._dojowidget = false; // true = widget Dojo, false = HTML puro
    },

    // LIFECYCLE HOOKS - Equivalenti a @compiler in Python

    _creating: function(attributes, sourceNode) {
        // Preparazione attributi PRIMA della creazione
        // Ritorna savedAttrs per _created
        return savedAttrs;
    },

    creating: function(attributes, sourceNode) {
        // Override per widget specifico
        return {};
    },

    _created: function(newobj, savedAttrs, sourceNode, ind) {
        // DOPO creazione widget
        // Setup eventi, binding, ecc.
        this.created(newobj, savedAttrs, sourceNode);
    },

    created: function(newobj, savedAttrs, sourceNode) {
        // Override per widget specifico
    },

    // Opzionale
    _beforeCreation: function(attributes, sourceNode) {
        // Può annullare creazione ritornando false
    }
});
```

### 5.3 Proprietà Fondamentali dei Widget

| Proprietà | Tipo | Descrizione |
|-----------|------|-------------|
| `_domtag` | string | Tag HTML da creare (`'div'`, `'input'`, `'*'` = nessuno) |
| `_dojotag` | string | Classe Dojo da istanziare |
| `_dojowidget` | boolean | `true` = Dojo widget, `false` = HTML element |
| `_defaultValue` | any | Valore di default |
| `_defaultEvent` | string | Evento principale (es. `'onclick'`) |

### 5.4 Lifecycle Hooks - Mappatura al Pattern Compiler

```
Python @compiler           JS Widget Handler
─────────────────────────────────────────────
@compiler                  _creating() + _created()
  def button(node, ch):      creating(attr, srcNode)
    ...                      created(widget, savedAttr, srcNode)

compile_template           _domtag + attributes processing
```

**Flusso completo**:

```
sourceNode.build()
    │
    ▼
GnrWdgHandler.create(tag, dest, attr, ind, srcNode)
    │
    ├─► getHandler(tag) → gnr.widgets.TextBox
    │
    ├─► handler._creating(attr, srcNode)
    │       └─► prepara attributi, estrae opzioni
    │
    ├─► createDojoWidget() o createHtmlElement()
    │       └─► crea istanza widget/DOM
    │
    ├─► linkSourceNode(widget, srcNode)
    │       └─► srcNode.widget = widget
    │       └─► widget.sourceNode = srcNode
    │
    └─► handler._created(widget, savedAttr, srcNode)
            └─► setup eventi, binding, validazione
```

### 5.5 Classi Aggiuntive in genro_wdg.js

| Classe | Descrizione |
|--------|-------------|
| `gnr.RowEditor` | Editor per righe di griglia |
| `gnr.GridEditor` | Editor per celle di griglia |
| `gnr.GridFilterManager` | Gestione filtri griglia |
| `gnr.GridChangeManager` | Gestione modifiche griglia |

---

## 6. Pattern Chiave per genro-bag-js

### 5.1 Subscription/Trigger System

**Requisito**: Sistema reattivo per propagazione eventi

```
Bag modifica → onNodeTrigger() → subscriber.callback()
                    ↓
              propagazione al parent
                    ↓
              fino alla root
```

**Python equivalente da creare**: Sistema di subscription con callback

### 5.2 Two-Way Data Binding

**Requisito**: Widget ↔ Data sincronizzazione

```
Widget change → setRelativeData() → Bag update → trigger → altri widget
```

**Note**: Questo è responsabilità del DOMCompiler, non del core Bag

### 5.3 Lazy Resolution

**Requisito**: Resolver con caching e expiration

```javascript
getValue() {
    if (resolver && !resolver.expired()) {
        return cached_value;
    }
    if (resolver) {
        value = resolver.resolve();
    }
    return value;
}
```

**Python equivalente**: ✅ Già implementato con `BagResolver`

### 5.4 Path Syntax

**Requisito**: Supporto path con speciali

| Syntax | Significato | Priorità |
|--------|-------------|----------|
| `a.b.c` | Traversal standard | ✅ Già in Python |
| `?attr=value` | Query per attributo | 🔴 Da implementare |
| `#N` | Accesso per indice | 🔴 Da implementare |
| `^path` | Path relativo (datapath) | 🟡 Per DOMCompiler |

---

## 6. Mapping Python → JavaScript

### 6.1 Classi Core

| Python | JavaScript | Note |
|--------|------------|------|
| `BagNode` | `gnr.GnrBagNode` | ✅ Equivalente |
| `Bag` | `gnr.GnrBag` | ✅ Equivalente |
| `BagResolver` | `gnr.GnrBagResolver` | ✅ Equivalente |
| `BagBuilderBase` | - | 🆕 Non esiste in JS |
| `BagCompilerBase` | - | 🆕 Non esiste in JS |
| - | `gnr.GnrDomSourceNode` | DOM-specific |
| - | `gnr.GnrDomSource` | DOM-specific |

### 6.2 Metodi da Implementare in JS

**Già coperti concettualmente**:
- `getValue()` / `setValue()`
- `getAttr()` / `setAttr()`
- `setItem()` / `getItem()` / `getNode()`
- `toXml()` / `fromXml()`
- `toJson()` / `fromJson()`
- Subscription system
- Resolver system

**Nuovi in Python (da portare)**:
- Decoratore `@element` → Decoratore JS/TS
- Decoratore `@compiler` → Decoratore JS/TS
- Decoratore `@expander` → Decoratore JS/TS
- `compile_template` system
- Builder validation (sub_tags)

---

## 7. Considerazioni per genro-bag-js

### 7.1 Cosa Mantenere dal JS Esistente

1. **Subscription system** - Pattern collaudato
2. **Trigger propagation** - Essenziale per reattività
3. **Path syntax** - Compatibilità con codice esistente
4. **XML serialization format** - Interoperabilità

### 7.2 Cosa NON Portare (migliorato in Python)

1. **Dojo dependency** - Usare TS puro
2. **Global state** (`genro.*`) - Usare pattern moderni
3. **Mixed concerns** - Separare Bag/Builder/Compiler
4. **Implicit behaviors** - Espliciti e documentati

### 7.3 Architettura Proposta

```
genro-bag-js/
├── src/
│   ├── bag.ts              # GnrBag equivalente
│   ├── bagnode.ts          # GnrBagNode equivalente
│   ├── resolver.ts         # GnrBagResolver equivalente
│   ├── builder.ts          # BagBuilderBase (NUOVO)
│   ├── compiler.ts         # BagCompilerBase (NUOVO)
│   ├── decorators/
│   │   ├── element.ts      # @element
│   │   ├── compiler.ts     # @compiler
│   │   └── expander.ts     # @expander
│   └── serialize/
│       ├── xml.ts          # XML compatible con JS legacy
│       └── json.ts         # JSON format
```

---

## 8. Funzionalità JS Non Presenti in Python

### 8.1 Da Valutare per Python

| Feature JS | Descrizione | Aggiungere a Python? |
|------------|-------------|---------------------|
| `?attr=value` | Query path | 🤔 Utile |
| `#N` index | Accesso numerico | 🤔 Utile |
| `_dynattr` | Attributi dinamici | 🟡 Per Compiler |
| `_trigger_*` | Trigger separati | ✅ Già simile |

### 8.2 Solo per DOM (non per core)

- `build()` / `rebuild()` / `destroy()`
- `getWidget()` / `getDomNode()`
- `absDatapath()` / `getRelativeData()`
- Tag handlers registration

---

## 9. Conclusioni

### Strategia Raccomandata

1. **Core Bag** (genro-bag-js):
   - Seguire architettura Python
   - Mantenere compatibilità formato XML/JSON con JS legacy
   - Implementare subscription system ispirato a JS

2. **Builder System** (genro-bag-js):
   - Portare da Python (non esiste in JS legacy)
   - Decoratori TypeScript per `@element`

3. **Compiler System** (genro-bag-js):
   - Portare da Python (non esiste in JS legacy)
   - Base per futuri DOMCompiler

4. **DOM Integration** (futuro):
   - Ispirarsi a `GnrDomSource` / `GnrDomSourceNode`
   - Ma come Compiler separato, non estensione Bag

### File JS di Riferimento

| File | Linee | Contenuto | Rilevanza |
|------|-------|-----------|-----------|
| `gnrbag.js` | 2577 | Core Bag/Node | ⭐⭐⭐ |
| `gnrdomsource.js` | 2100 | DOM extension | ⭐⭐ (per DOMCompiler) |
| `genro_src.js` | 652 | Trigger handler | ⭐⭐ (pattern) |
| `genro_wdg.js` | ~1900 | Widget Handler (GnrWdgHandler) | ⭐⭐⭐ DOM Build |
| `genro_widgets.js` | ~4500 | Widget definitions (tutti i widget) | ⭐⭐⭐ DOM Build |

---

**Prossimi passi**:
1. Definire API TypeScript per core classes
2. Implementare subscription system
3. Portare Builder/Compiler da Python
4. Test di interoperabilità XML con JS legacy
