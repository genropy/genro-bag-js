# genro.js - Proposta di Split in Moduli

## Principio Guida

**`genro` rimane l'UNICA variabile globale.**

I moduli si agganciano a genro tramite:
1. Handler iniettati (`genro.xxx = new XxxHandler(genro)`)
2. Mixin di metodi (`Object.assign(genro, moduleMethods)`)

---

## Analisi delle Responsabilità Attuali

Ho identificato **12 aree funzionali** in genro.js:

| Area | Linee | Metodi | Note |
|------|-------|--------|------|
| **Lifecycle** | 58-262, 559-786 | constructor, genroInit, start, dostart | Core essenziale |
| **Data Access** | 1634-1770 | getData, setData, getDataNode, _ | Facade su Bag |
| **Events/PubSub** | 1119-1124, 1801-1881 | fireEvent, publish, subscribe | Dojo dipendente |
| **Navigation** | 1502-1532, 2112-2156 | makeUrl, gotoURL, constructUrl | URL building |
| **Storage** | 1915-1942, 379-389 | setInStorage, getFromStorage, cookie | Persistenza |
| **Forms** | 1989-2036 | getForm, formById, getFormData | Registry form |
| **Nodes** | 2037-2096 | nodeById, domById, wdgById | Registry nodi |
| **Formatting** | 1216-1349 | format() | 130 linee! |
| **User Events** | 405-537 | _registerUserEvents, onUserEvent | Tracking input |
| **Windows** | 341-377, 917-995 | closePage, getChildWindow, iframe | Multi-window |
| **Polling** | 788-821 | setAutoPolling, setFastPolling | Heartbeat |
| **Utils** | 264-340, 1400-1418 | compare, timeIt, safetry, getCounter | Varie |

---

## Proposta Struttura

```
src/
├── genro_js/
│   ├── index.js              # Entry point, crea genro e aggancia tutto
│   ├── GenroClient.js        # Classe core (solo lifecycle)
│   │
│   ├── core/
│   │   ├── DataAccess.js     # getData, setData, getDataNode
│   │   ├── EventBus.js       # publish, subscribe, fireEvent
│   │   └── DataTriggers.js   # dataTrigger, fireDataTrigger
│   │
│   ├── navigation/
│   │   ├── UrlBuilder.js     # makeUrl, constructUrl, addKwargs
│   │   └── Router.js         # gotoURL, gotoHome, pageReload
│   │
│   ├── storage/
│   │   ├── LocalStorage.js   # setInStorage, getFromStorage
│   │   └── ContextManager.js # loadContext, saveContextCookie
│   │
│   ├── registry/
│   │   ├── NodeRegistry.js   # nodeById, _index
│   │   ├── FormRegistry.js   # formById, getForm
│   │   └── WidgetRegistry.js # wdgById, widget
│   │
│   ├── ui/
│   │   ├── UserEvents.js     # _registerUserEvents, mouse/keyboard
│   │   ├── WindowManager.js  # closePage, getChildWindow, iframe
│   │   └── ScreenLock.js     # lockScreen
│   │
│   ├── utils/
│   │   ├── Formatter.js      # format() - BIG refactor candidate
│   │   ├── Compare.js        # compare, isEqual, compareDict
│   │   ├── Counter.js        # getCounter, time36Id
│   │   └── Debug.js          # debug, log, setdebug, bp
│   │
│   └── platform/
│       ├── Polling.js        # setAutoPolling, setFastPolling
│       ├── DragDrop.js       # dragDropConnect
│       └── Shortcuts.js      # setDefaultShortcut (delega a dev)
```

---

## Modulo 1: GenroClient.js (Core)

**Solo lifecycle, ~150 linee**

```javascript
// src/genro_js/GenroClient.js

export class GenroClient {
    constructor(config) {
        this.pageId = config.page_id;
        this.startArgs = config.startArgs || {};
        this.baseUrl = config.baseUrl;

        // Strutture base
        this._data = null;      // Sarà Bag
        this._dataroot = null;  // Sarà Bag container

        // Handler placeholder (iniettati dopo)
        this.rpc = null;
        this.src = null;
        this.wdg = null;
        this.dom = null;
        this.dlg = null;
        this.dev = null;
        this.wsk = null;

        // Stato
        this._pageStarted = false;
        this._counter = 0;

        // Init asincrono
        setTimeout(() => this._init(), 1);
    }

    async _init() {
        // Attende che i moduli si aggancino
        // Poi chiama start()
    }

    async start() {
        // Crea le Bag
        // Chiama src.getMainSource()
        // Chiama dostart()
    }

    dostart(mainBagPage) {
        // Build UI dalla ricetta
        // Setup eventi
        // Pubblica onPageStart
    }
}
```

---

## Modulo 2: DataAccess.js

**Facade per accesso dati, ~100 linee**

```javascript
// src/genro_js/core/DataAccess.js

export const DataAccessMixin = {
    getData(path, dflt = null) {
        if (!path) return this._data;
        const node = this.getDataNode(path);
        return node ? node.getValue() ?? dflt : dflt;
    },

    setData(path, value, attributes, doTrigger) {
        path = this.pathResolve(path);
        this._data.setItem(path, value, attributes, { doTrigger, lazySet: true });
    },

    getDataNode(path, autocreate, dflt) {
        path = this.pathResolve(path);
        if (!path) return this._dataroot.getNode('main');

        if (path.startsWith('*S')) {
            return this.src.getNode(path.slice(3));
        }
        if (path.startsWith('*D')) {
            path = path.slice(3);
        }
        return this._data.getNode(path, false, autocreate, dflt);
    },

    getDataAttr(path, attr, dflt) {
        const node = this.getDataNode(path);
        return node?.getAttr(attr, dflt);
    },

    // Alias breve
    _(path, dflt) {
        return this.src.getNode().getRelativeData(path);
    },

    pathResolve(obj) {
        if (typeof obj === 'string') {
            return this.src.getNode()?.absDatapath(obj) ?? obj;
        }
        if (obj?.absDatapath) {
            return obj.absDatapath();
        }
        if (obj?.sourceNode) {
            return obj.sourceNode.absDatapath();
        }
        return null;
    }
};
```

---

## Modulo 3: EventBus.js

**Sistema pub/sub senza Dojo, ~80 linee**

```javascript
// src/genro_js/core/EventBus.js

export class EventBus {
    constructor() {
        this._subscribers = new Map();
    }

    subscribe(topic, handler) {
        if (!this._subscribers.has(topic)) {
            this._subscribers.set(topic, new Set());
        }
        this._subscribers.get(topic).add(handler);

        // Return unsubscribe function
        return () => this._subscribers.get(topic)?.delete(handler);
    }

    publish(topic, ...args) {
        const subs = this._subscribers.get(topic);
        if (subs) {
            for (const handler of subs) {
                try {
                    handler(...args);
                } catch (e) {
                    console.error(`EventBus error on topic "${topic}":`, e);
                }
            }
        }
    }

    unsubscribe(topic, handler) {
        this._subscribers.get(topic)?.delete(handler);
    }

    clear(topic) {
        if (topic) {
            this._subscribers.delete(topic);
        } else {
            this._subscribers.clear();
        }
    }
}

// Mixin per genro
export const EventBusMixin = {
    publish(topic, kw) {
        // Gestisce sia stringa che oggetto {topic, parent, iframe, ...}
        if (typeof topic === 'string') {
            this._eventBus.publish(topic, kw);
            return;
        }

        // Logica complessa per iframe/parent/nodeId
        // ... (preservata dal legacy)
    },

    fireEvent(path, msg = true) {
        path = this.src.getNode().absDatapath(path);
        this._data.setItem(path, msg);
        this._data.setItem(path, null, null, { doTrigger: false });
    }
};
```

---

## Modulo 4: UrlBuilder.js

**Costruzione URL, ~60 linee**

```javascript
// src/genro_js/navigation/UrlBuilder.js

export const UrlBuilderMixin = {
    makeUrl(url, kwargs) {
        if (!url.includes('://')) {
            if (!url.startsWith('/')) {
                const base = document.location.pathname || '/index';
                url = base + '/' + url;
            }
            url = document.location.protocol + '//' + document.location.host + url;
        }
        return this.addKwargs(url, kwargs);
    },

    addKwargs(url, kwargs) {
        if (!kwargs || Object.keys(kwargs).length === 0) {
            return url + document.location.search;
        }

        const params = new URLSearchParams();
        params.set('page_id', this.pageId);
        params.set('_no_cache_', this.getCounter());

        for (const [key, value] of Object.entries(kwargs)) {
            params.set(key, value);
        }

        return url + '?' + params.toString();
    },

    addParamsToUrl(url, params) {
        if (!url || !params || Object.keys(params).length === 0) {
            return url;
        }
        const sep = url.includes('?') ? '&' : '?';
        const paramStr = Object.entries(params)
            .filter(([_, v]) => v != null && v !== '')
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
        return url + sep + paramStr;
    },

    absoluteUrl(url, kwargs, avoidCache = true) {
        const base = document.location.pathname;
        if (url) {
            const sep = url.startsWith('?') ? '' : '/';
            url = base + sep + url;
        } else {
            url = base;
        }

        if (kwargs) {
            return this.addKwargs(url, kwargs);
        }
        return url + document.location.search;
    }
};
```

---

## Modulo 5: NodeRegistry.js

**Registry sourceNode per ID, ~80 linee**

```javascript
// src/genro_js/registry/NodeRegistry.js

export const NodeRegistryMixin = {
    nodeById(nodeId, scope) {
        let childpath, node;

        // Path relativo con /
        if (nodeId.startsWith('/')) {
            childpath = nodeId.slice(1);
            node = this._resolveRelativeNode(scope, childpath);
        } else {
            // Path assoluto o con /
            if (nodeId.includes('/')) {
                [nodeId, ...childpath] = nodeId.split('/');
                childpath = childpath.join('/');
            }

            // Special: FORM, ANCHOR
            if (nodeId.startsWith('FORM')) {
                node = scope.attributeOwnerNode('formId,_fakeform') || scope.getParentNode();
            } else if (nodeId.startsWith('ANCHOR')) {
                node = scope.attributeOwnerNode('_anchor') || scope.getParentNode();
            }
        }

        node = node || this.src._index[nodeId];

        if (!node && this.src.building) {
            node = this.src._main.getNodeByAttr('nodeId', nodeId);
        }

        return childpath ? node?.getChild(childpath) : node;
    },

    domById(nodeId, scope) {
        const node = this.nodeById(nodeId, scope);
        return node?.getDomNode() ?? document.getElementById(nodeId);
    },

    wdgById(nodeId, scope) {
        return this.nodeById(nodeId, scope)?.getWidget();
    },

    _resolveRelativeNode(scope, childpath) {
        let node = scope?.attr?.nodeId ? scope : null;

        if (!node) {
            if (scope?.attr?._childname) {
                childpath = scope.attr._childname + '/' + childpath;
            }
            node = scope?.getParentNode();

            while (node && !node.attr?.nodeId) {
                if (node.attr?._childname) {
                    childpath = node.attr._childname + '/' + childpath;
                }
                node = node.getParentNode();
            }
        }

        return node;
    }
};
```

---

## Modulo 6: LocalStorage.js

**Persistenza locale, ~40 linee**

```javascript
// src/genro_js/storage/LocalStorage.js

export const LocalStorageMixin = {
    setInStorage(storageType = 'session', key, value, nameSpace) {
        key = this._namespaceKey(key, nameSpace);
        const storage = storageType === 'local' ? localStorage : sessionStorage;

        if (value == null || value === '') {
            storage.removeItem(key);
        } else {
            storage.setItem(key, this._toTypedText(value));
        }
    },

    getFromStorage(storageType = 'session', key, nameSpace) {
        key = this._namespaceKey(key, nameSpace);
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        const value = storage.getItem(key);

        if (value == null) return null;

        try {
            return this._fromTypedText(value);
        } catch (e) {
            console.log('Storage key cleanup:', key);
            storage.removeItem(key);
            return null;
        }
    },

    _namespaceKey(key, nameSpace) {
        // Implementa logica namespace
        return nameSpace ? `${nameSpace}:${key}` : key;
    },

    _toTypedText(value) {
        // Serializzazione con tipo (legacy asTypedTxt)
        return JSON.stringify(value);
    },

    _fromTypedText(text) {
        // Deserializzazione (legacy convertFromText)
        return JSON.parse(text);
    }
};
```

---

## index.js - Entry Point

```javascript
// src/genro_js/index.js

import { GenroClient } from './GenroClient.js';
import { DataAccessMixin } from './core/DataAccess.js';
import { EventBus, EventBusMixin } from './core/EventBus.js';
import { UrlBuilderMixin } from './navigation/UrlBuilder.js';
import { NodeRegistryMixin } from './registry/NodeRegistry.js';
import { LocalStorageMixin } from './storage/LocalStorage.js';
// ... altri mixin

export function createGenro(config) {
    const genro = new GenroClient(config);

    // EventBus interno
    genro._eventBus = new EventBus();

    // Applica mixin
    Object.assign(genro, DataAccessMixin);
    Object.assign(genro, EventBusMixin);
    Object.assign(genro, UrlBuilderMixin);
    Object.assign(genro, NodeRegistryMixin);
    Object.assign(genro, LocalStorageMixin);
    // ... altri mixin

    return genro;
}

// Singleton globale
export let genro = null;

export function initGenro(config) {
    genro = createGenro(config);
    window.genro = genro;  // Backward compatibility
    return genro;
}
```

---

## Moduli NON-CORE (da spostare altrove)

Questi moduli sono funzionalità specifiche, non parte del core genro_js:

| Modulo | Destinazione | Motivo |
|--------|--------------|--------|
| `Formatter.js` | `src/utils/` | Utility generica |
| `UserEvents.js` | `src/ui/` | UI-specific |
| `WindowManager.js` | `src/ui/` | Multi-window UI |
| `Polling.js` | `src/rpc/` | Server communication |
| `DragDrop.js` | `src/ui/` | UI interaction |
| `Shortcuts.js` | `src/ui/` o in `dev` | Dev tools |

---

## Piano di Migrazione

### Fase 1: Estrazione Pura (non rompe nulla)
1. Crea struttura cartelle
2. Estrai mixin come file separati
3. Import tutti in index.js
4. Testa che funzioni identicamente

### Fase 2: Modernizzazione Graduale
1. Sostituisci `dojo.subscribe/publish` con EventBus
2. Sostituisci `dojo.hitch` con arrow functions
3. Sostituisci `dojo.cookie` con native API

### Fase 3: Rimuovi Dipendenze
1. Rimuovi genropatches (non servono senza Dojo)
2. Rimuovi patchConsole (debug Dojo)
3. Modernizza utilities (`objectUpdate` → spread, etc.)

---

## Test Strategy

Per garantire di non rompere nulla:

1. **Snapshot dei metodi pubblici**: Lista tutti i metodi di genro pre-split
2. **Test di interface**: Verifica che tutti i metodi esistano post-split
3. **Test funzionali**: Lifecycle completo constructor→onPageStart
4. **Test integrazione**: Una pagina reale funziona

```javascript
// test/genro_interface.test.js
const EXPECTED_METHODS = [
    'getData', 'setData', 'getDataNode', '_',
    'publish', 'fireEvent',
    'nodeById', 'domById', 'wdgById',
    'makeUrl', 'gotoURL',
    'setInStorage', 'getFromStorage',
    // ... tutti i metodi pubblici
];

test('genro has all expected methods', () => {
    const genro = createGenro({page_id: 'test'});
    for (const method of EXPECTED_METHODS) {
        expect(typeof genro[method]).toBe('function');
    }
});
```

---

## Metriche Target

| Metrica | Attuale | Target |
|---------|---------|--------|
| Linee genro.js | ~2500 | ~150 (solo GenroClient) |
| Moduli | 1 | 12-15 |
| Linee max/modulo | 2500 | 150 |
| Linee media/modulo | 2500 | 80 |
| Dipendenze Dojo | ~50 | 0 |
