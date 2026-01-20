# genro.js - Analisi Architetturale Dettagliata

## Overview del Ciclo di Vita

```
┌────────────────────────────────────────────────────────────────────┐
│  1. HTML Bootstrap (server-rendered)                               │
│     - Carica JS/CSS                                                │
│     - Crea: new gnr.GenroClient({page_id, startArgs, ...})        │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  2. constructor() [linee 58-116]                                   │
│     - Salva page_id, startArgs                                     │
│     - Setup iniziale (browserIdentifier, serverTimeDelta)          │
│     - setTimeout → genroInit() (async, 1ms)                        │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  3. genroInit() [linee 177-262]                                    │
│     - Crea tutti gli HANDLER:                                      │
│       • this.rpc = new gnr.GnrRpcHandler(this)                    │
│       • this.src = new gnr.GnrSrcHandler(this)                    │
│       • this.wdg = new gnr.GnrWdgHandler(this)                    │
│       • this.dev = new gnr.GnrDevHandler(this)                    │
│       • this.dlg = new gnr.GnrDlgHandler(this)                    │
│       • this.dom = new gnr.GnrDomHandler(this)                    │
│       • this.vld = new gnr.GnrValidator(this)                     │
│       • this.wsk = new gnr.GnrWebSocketHandler(this)              │
│       • this.som = new gnr.GnrSharedObjectHandler(this)           │
│     - Applica genropatches (Dojo fixes)                            │
│     - dojo.addOnLoad → start()                                     │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  4. start() [linee 559-651]                                        │
│     - CREA LE DUE BAG:                                             │
│       • this._dataroot = new gnr.GnrBag()     ← root container    │
│       • this._data = new gnr.GnrBag()         ← BAG DATI          │
│       • this._dataroot.setItem('main', this._data)                │
│     - Setup WebSocket: this.wsk.create()                           │
│     - Determina parent/root page_id (per iframe)                   │
│     - genro.src.getMainSource(callback)  → chiama server          │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  5. Server risponde con RICETTA + DATI                             │
│     mainBagPage = {                                                │
│       _value: Bag (ricetta UI),                                    │
│       attr: {embedded data, redirect info, etc.}                   │
│     }                                                              │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  6. dostart(mainBagPage) [linee 653-786]                           │
│     - loadContext() → carica cookie/context                        │
│     - genro.src.startUp(mainBagPage) → BUILD DOM DA RICETTA       │
│     - Subscribe ai dataTriggers                                    │
│     - Setup shortcuts, event handlers                              │
│     - Pubblica 'onPageStart'                                       │
└────────────────────────────────────────────────────────────────────┘
```

## Le Due Bag: Struttura

```javascript
// Creazione in start() [linea 567-570]
this._dataroot = new gnr.GnrBag();   // Container root
this._dataroot.setBackRef();          // Abilita navigazione inversa
this._data = new gnr.GnrBag();        // BAG DATI PRINCIPALE
this._dataroot.setItem('main', this._data);

// Struttura risultante:
_dataroot
└── main (this._data)          ← BAG DATI
    ├── gnr/                   ← info sistema (locale, user, etc.)
    ├── _clientCtx/            ← context persistente (cookie)
    ├── tables/                ← dati tabelle DB
    └── [custom paths...]      ← dati applicazione
```

La **BAG RICETTA** è gestita da `genro.src`:
```javascript
// In genro_src.js
this._main = new gnr.GnrDomSource();  // BAG RICETTA (albero sourceNode)
```

## Sistema di Binding `^path`

Il carattere `^` indica binding reattivo:

```javascript
// Nella ricetta:
widget.value = '^.mycolor'

// Significa:
// 1. Leggi valore iniziale da genro._data.getItem('.mycolor')
// 2. Sottoscrivi a cambiamenti su quel path
// 3. Quando il dato cambia → aggiorna widget
// 4. Quando widget cambia → aggiorna dato
```

Il binding è gestito in `gnrdomsource.js` tramite:
- `registerDynAttr()` - registra attributo dinamico
- `_dynattr_*` - handler per ogni tipo di binding

## Mappa delle Responsabilità

### gnr.GenroClient (questo file)

| Area | Linee | Metodi Chiave |
|------|-------|---------------|
| **Lifecycle** | 58-262 | `constructor`, `genroInit`, `start`, `dostart` |
| **Data Access** | 1679-1770 | `getData`, `setData`, `getDataNode`, `_` |
| **Events** | 1119-1124, 1801-1881 | `fireEvent`, `publish` |
| **Navigation** | 2112-2156 | `gotoURL`, `constructUrl`, `joinPath` |
| **RPC Facade** | 2162-2175 | `serverCall`, `remoteJson` |
| **Storage** | 1915-1942 | `setInStorage`, `getFromStorage` |
| **Utils** | 264-315 | `compare`, `timeIt`, `safetry` |
| **Forms** | 1989-2036 | `getForm`, `formById`, `getFormData` |
| **Nodes** | 2037-2096 | `nodeById`, `domById`, `wdgById` |
| **Formatting** | 1216-1349 | `format` |
| **User Events** | 405-537 | `_registerUserEvents`, `onUserEvent` |
| **Window Mgmt** | 341-377, 917-947 | `closePage`, `getChildWindow` |
| **Polling** | 788-821 | `setAutoPolling`, `setFastPolling` |

## Proposta di Decomposizione

### Struttura Target

```
src/
├── core/
│   ├── GenroClient.ts        # Solo bootstrap e lifecycle
│   ├── DataStore.ts          # Gestione _data e _dataroot
│   └── EventBus.ts           # publish/subscribe
│
├── data/
│   ├── DataAccess.ts         # getData, setData, getDataNode
│   ├── DataBinding.ts        # Sistema ^ binding
│   └── DataTriggers.ts       # dataTrigger, fireDataTrigger
│
├── handlers/                  # Handler esistenti (già separati)
│   ├── RpcHandler.ts
│   ├── SrcHandler.ts
│   ├── WdgHandler.ts
│   ├── DomHandler.ts
│   ├── DlgHandler.ts
│   ├── DevHandler.ts
│   └── ...
│
├── navigation/
│   ├── UrlBuilder.ts         # makeUrl, constructUrl, addKwargs
│   ├── Router.ts             # gotoURL, gotoHome
│   └── WindowManager.ts      # iframe, external windows
│
├── storage/
│   ├── LocalStorage.ts       # setInStorage, getFromStorage
│   └── ContextManager.ts     # loadContext, saveContextCookie
│
├── forms/
│   ├── FormRegistry.ts       # formById, getForm
│   └── FormUtils.ts          # getFormData, getFormChanges
│
├── nodes/
│   ├── NodeRegistry.ts       # nodeById, _index
│   └── NodeUtils.ts          # domById, wdgById
│
├── utils/
│   ├── Formatter.ts          # format() - 130 linee!
│   ├── Compare.ts            # compare, isEqual
│   ├── Counter.ts            # getCounter, time36Id
│   └── Debug.ts              # debug, log, setdebug
│
└── platform/
    ├── UserEvents.ts         # _registerUserEvents
    ├── Polling.ts            # setAutoPolling
    └── DragDrop.ts           # dragDropConnect
```

### Modulo 1: GenroClient.ts (Core Bootstrap)

```typescript
// Solo ~100 linee - puro lifecycle
export class GenroClient {
    readonly pageId: string;
    readonly startArgs: StartArgs;

    // Handler (iniettati)
    readonly rpc: RpcHandler;
    readonly src: SrcHandler;
    readonly wdg: WdgHandler;
    // ...

    // Data stores
    readonly dataStore: DataStore;

    constructor(config: GenroConfig) {
        this.pageId = config.pageId;
        this.startArgs = config.startArgs;
        this.dataStore = new DataStore();
        // ...
    }

    async init(): Promise<void> {
        await this.createHandlers();
        await this.loadMainSource();
    }

    private async loadMainSource(): Promise<void> {
        const recipe = await this.rpc.getMainSource();
        this.src.build(recipe);
    }
}
```

### Modulo 2: DataStore.ts

```typescript
// Gestisce le due Bag
export class DataStore {
    private _root: Bag;
    private _data: Bag;

    constructor() {
        this._root = new Bag();
        this._root.setBackRef();
        this._data = new Bag();
        this._root.setItem('main', this._data);
    }

    get data(): Bag { return this._data; }
    get root(): Bag { return this._root; }

    getData(path: string, defaultValue?: any): any {
        // ...
    }

    setData(path: string, value: any, attrs?: object): void {
        // ...
    }

    getDataNode(path: string): BagNode | null {
        // ...
    }
}
```

### Modulo 3: EventBus.ts

```typescript
// Pub/Sub pulito senza Dojo
export class EventBus {
    private subscribers = new Map<string, Set<Function>>();

    publish(topic: string, ...args: any[]): void {
        const subs = this.subscribers.get(topic);
        if (subs) {
            subs.forEach(fn => fn(...args));
        }
    }

    subscribe(topic: string, handler: Function): () => void {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
        }
        this.subscribers.get(topic)!.add(handler);

        // Return unsubscribe function
        return () => this.subscribers.get(topic)?.delete(handler);
    }
}
```

## Dipendenze da Rimuovere

| Dipendenza Dojo | Sostituzione |
|-----------------|--------------|
| `dojo.declare` | ES6 `class` |
| `dojo.connect` | `addEventListener` |
| `dojo.subscribe/publish` | Custom EventBus |
| `dojo.hitch` | Arrow functions / `.bind()` |
| `dojo.cookie` | Native `document.cookie` o js-cookie |
| `dojo.byId` | `document.getElementById` |
| `dojo.addClass/removeClass` | `classList.add/remove` |
| `dojo.Deferred` | Native `Promise` |

## Metodi da Eliminare/Deprecare

| Metodo | Motivo |
|--------|--------|
| `patchConsole*` | Hack per debug Dojo |
| `genropatches.*` | Specifici per vecchio Dojo |
| `setStateClass` | Widget Dojo |
| `dojo.version` checks | Legacy |

## Metriche Decomposizione

| Modulo Attuale | Linee | Moduli Target | Linee/Modulo |
|----------------|-------|---------------|--------------|
| genro.js | ~2200 | 15+ moduli | ~150 media |

**Obiettivo**: Nessun modulo > 300 linee, media ~150 linee.

## Ordine di Migrazione Consigliato

1. **EventBus** - indipendente, sostituisce dojo.publish/subscribe
2. **DataStore** - core, poche dipendenze
3. **DataAccess** - facade su DataStore
4. **NodeRegistry** - gestione sourceNode
5. **GenroClient** - rifattorizzato come orchestratore
6. **Handler** uno alla volta

## Note Architetturali

### Pattern Attuale: God Object
`genro.js` è un "God Object" che fa tutto. Contiene:
- Bootstrap
- Data access
- Event handling
- Navigation
- Forms
- Windows
- Formatting
- Debug
- E molto altro...

### Pattern Target: Composition
Il nuovo design dovrebbe usare composizione:
```typescript
const genro = new GenroClient({
    dataStore: new DataStore(),
    eventBus: new EventBus(),
    router: new Router(),
    // ...
});
```

### Singleton vs Instance
Attualmente `genro` è un singleton globale. Nel nuovo design:
- Mantenere singleton per retrocompatibilità
- Ma permettere istanze multiple per testing
- Export sia classe che istanza default
