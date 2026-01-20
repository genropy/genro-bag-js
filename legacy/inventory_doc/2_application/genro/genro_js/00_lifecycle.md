# genro.js - Lifecycle Completo

## Overview

`genro.js` definisce `gnr.GenroClient`, il cuore dell'applicazione client-side Genropy.
È un "God Object" di ~2500 linee che orchestra tutto.

**Principio chiave**: `genro` è l'UNICA variabile globale. Tutto si aggancia a lui.

---

## Lifecycle Dettagliato

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 1: BOOTSTRAP HTML (Server-Side)                                       │
│                                                                             │
│  Il server Python genera HTML con:                                          │
│  - Script tags per Dojo e genropy JS                                        │
│  - new gnr.GenroClient({page_id, startArgs, ...})                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 2: constructor() [linee 58-116]                                       │
│                                                                             │
│  Inizializzazione sincrona immediata:                                       │
│  ├── patchConsole()           → Patch console per Dojo                      │
│  ├── Salva configurazione:                                                  │
│  │   ├── this.page_id                                                       │
│  │   ├── this.startArgs                                                     │
│  │   ├── this.debuglevel                                                    │
│  │   ├── this.websockets_url                                                │
│  │   ├── this.pageMode, this.pageModule                                     │
│  │   ├── this.baseUrl                                                       │
│  │   └── this.serverTime, this.serverTimeDelta                              │
│  ├── Estrae da startArgs:                                                   │
│  │   ├── isDeveloper, isMobile, isCordova                                   │
│  │   ├── deviceScreenSize, extraFeatures                                    │
│  │   └── debugpy                                                            │
│  ├── Inizializza strutture:                                                 │
│  │   ├── this.theme = {}                                                    │
│  │   ├── this.ext = {}                                                      │
│  │   ├── this.watches = {}                                                  │
│  │   ├── this.sounds = {}                                                   │
│  │   └── this.timeProfilers = []                                            │
│  ├── setBrowserIdentifier()                                                 │
│  ├── dojo.subscribe('gnrServerLog', ...)                                    │
│  ├── dojo.subscribe('externalSetData', ...)                                 │
│  └── setTimeout(genroInit, 1)  → ASYNC!                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (1ms dopo)
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 3: genroInit() [linee 177-262]                                        │
│                                                                             │
│  Inizializzazione asincrona:                                                │
│  ├── this.startTime = new Date()                                            │
│  ├── this.dialogStack = []                                                  │
│  ├── this._serverstore_paths = {}                                           │
│  ├── this._sharedObjects = {}                                               │
│  ├── this.pendingCallAfter = {}                                             │
│  ├── addPlugins()  → Carica window.genro_plugin_*                           │
│  ├── this.compareDict = {...}  → Operatori confronto                        │
│  │                                                                          │
│  ├── CREA GLI HANDLER:                                                      │
│  │   ├── this.rpc = new gnr.GnrRpcHandler(this)                            │
│  │   ├── this.src = new gnr.GnrSrcHandler(this)                            │
│  │   ├── this.wdg = new gnr.GnrWdgHandler(this)                            │
│  │   ├── this.dev = new gnr.GnrDevHandler(this)                            │
│  │   ├── this.dlg = new gnr.GnrDlgHandler(this)                            │
│  │   ├── this.dom = new gnr.GnrDomHandler(this)                            │
│  │   ├── this.vld = new gnr.GnrValidator(this)                             │
│  │   ├── this.wsk = new gnr.GnrWebSocketHandler(this, websockets_url)      │
│  │   └── this.som = new gnr.GnrSharedObjectHandler(this)                   │
│  │                                                                          │
│  ├── beforeunload listener → checkBeforeUnload()                            │
│  ├── pagehide listener → onWindowUnload()                                   │
│  ├── genropatches.*  → Fix per Dojo (se versione 1.1)                       │
│  ├── this.clsdict = {domsource: gnr.GnrDomSource, bag: gnr.GnrBag}         │
│  ├── this.prefs = {...}  → Preferenze default                               │
│  └── dojo.addOnLoad(genro, 'start')  → Quando DOM ready                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (quando DOM ready)
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 4: start() [linee 559-651]                                            │
│                                                                             │
│  *** CREAZIONE DELLE DUE BAG ***                                            │
│  ├── this._dataroot = new gnr.GnrBag()                                     │
│  ├── this._dataroot.setBackRef()  → Abilita navigazione inversa             │
│  ├── this._data = new gnr.GnrBag()  → BAG DATI principale                  │
│  ├── this._dataroot.setItem('main', this._data)                             │
│  │                                                                          │
│  ├── this.widget = {}                                                       │
│  ├── this._counter = 0                                                      │
│  ├── this.dlg.createStandardMsg(document.body)                              │
│  ├── this.contextIndex = {}                                                 │
│  ├── this.isMac = ...                                                       │
│  ├── this.isChrome = ...                                                    │
│  │                                                                          │
│  ├── this.wsk.create()  → Inizializza WebSocket                             │
│  ├── this.root_page_id = null                                               │
│  │                                                                          │
│  ├── SE isMobile:                                                           │
│  │   └── this.mobile = new gnr.GnrMobileHandler(this)                      │
│  ├── SE isCordova:                                                          │
│  │   └── this.cordova = new gnr.GnrCordovaHandler(this)                    │
│  │                                                                          │
│  ├── dojo.subscribe('debugstep', ...)                                       │
│  ├── dojo.subscribe('closePage', ...)                                       │
│  ├── window focus/blur listeners                                            │
│  │                                                                          │
│  ├── Gestione iframe parent:                                                │
│  │   ├── Determina mainGenroWindow                                          │
│  │   ├── Determina root_page_id, parent_page_id                             │
│  │   └── Salva parentIframeSourceNode                                       │
│  │                                                                          │
│  └── genro.src.getMainSource(callback)  → FETCH RICETTA DAL SERVER          │
│      └── callback chiama dostart(mainBagPage)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (dopo risposta server)
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 5: dostart(mainBagPage) [linee 653-786]                               │
│                                                                             │
│  BUILD DELL'INTERFACCIA:                                                    │
│  ├── loadContext()  → Carica cookie genroContext → _clientCtx               │
│  ├── genro.dom.addClass(body, 'startingPage')                               │
│  │                                                                          │
│  ├── *** genro.src.startUp(mainBagPage) ***                                 │
│  │   └── Costruisce DOM dalla ricetta Bag                                   │
│  │                                                                          │
│  ├── Rimuove classi loading:                                                │
│  │   ├── removeClass('mainWindow', 'waiting')                               │
│  │   └── removeClass('_gnrRoot', 'notvisible')                              │
│  ├── effect('_gnrRoot', 'fadein', {duration:400})                           │
│  │                                                                          │
│  ├── dragDropConnect()                                                      │
│  ├── standardEventConnection()                                              │
│  │                                                                          │
│  ├── SE isDeveloper:                                                        │
│  │   ├── addClass(body, 'isDeveloper')                                      │
│  │   └── genro.dev.inspectConnect()                                         │
│  │                                                                          │
│  ├── this._dataroot.subscribe('dataTriggers', {any: dataTrigger})           │
│  ├── dojo.subscribe('ping', genro.ping)                                     │
│  │                                                                          │
│  ├── Setup shortcuts:                                                       │
│  │   ├── Ctrl+Shift+D → showInspector                                       │
│  │   ├── Cmd/Ctrl+D → duplicateCommand                                      │
│  │   ├── Ctrl+Shift+I → showInspector                                       │
│  │   ├── Ctrl+Shift+S → takePicture                                         │
│  │   └── Shift+Space → copyFromCellAbove / lastSavedValue                   │
│  │                                                                          │
│  ├── _registerUserEvents()  → mouse, keyboard tracking                      │
│  ├── setAutoPolling()  → Ping periodico al server                           │
│  │                                                                          │
│  ├── DnD cross-iframe handling                                              │
│  ├── Resize cross-iframe handling                                           │
│  ├── window resize listener                                                 │
│  │                                                                          │
│  └── callAfter(100ms):                                                      │
│      ├── _connectToParentIframe()  (se in iframe)                           │
│      ├── windowMessageListener()                                            │
│      ├── fireEvent('gnr.onStart')                                           │
│      ├── publish('onPageStart')  ← APPLICAZIONE PRONTA                      │
│      ├── removeClass(body, 'startingPage')                                  │
│      ├── this._pageStarted = true                                           │
│      └── window.focus()                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 6: APPLICAZIONE ATTIVA                                                │
│                                                                             │
│  Event Loop:                                                                │
│  ├── User events → _registerUserEvents handlers                             │
│  ├── Data changes → dataTrigger() → _trigger_data topic                     │
│  ├── WebSocket messages → wsk handlers                                      │
│  ├── RPC calls → rpc.remoteCall                                             │
│  └── DOM updates → sourceNode → widget updates                              │
│                                                                             │
│  Ciclo Reattivo:                                                            │
│  ┌─────────────┐     trigger      ┌─────────────┐                          │
│  │  BAG DATI   │ ───────────────► │ sourceNode  │                          │
│  │ genro._data │                  │             │                          │
│  └─────────────┘                  └──────┬──────┘                          │
│        ▲                                 │                                  │
│        │                                 │ aggiorna                         │
│        │ setItem()                       ▼                                  │
│        │                          ┌─────────────┐                          │
│        │                          │   Widget    │                          │
│        │                          │   (DOM)     │                          │
│        └────────────────────────  └─────────────┘                          │
│                onChange event                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (quando utente chiude pagina)
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE 7: SHUTDOWN                                                           │
│                                                                             │
│  beforeunload:                                                              │
│  ├── checkBeforeUnload() → Verifica form con modifiche pendenti             │
│  └── Mostra warning se necessario                                           │
│                                                                             │
│  pagehide:                                                                  │
│  ├── onWindowUnload()                                                       │
│  │   ├── Notifica parent se external_window_key                             │
│  │   └── notifyPageClosing()                                                │
│  │       ├── Notifica tutti gli iframe figli                                │
│  │       ├── sendBeacon → server onClosedPage                               │
│  │       ├── publish('onClosePage')                                         │
│  │       └── saveContextCookie() → Salva _clientCtx in cookie               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Handler Creati

| Handler | Classe | Responsabilità |
|---------|--------|----------------|
| `genro.rpc` | `GnrRpcHandler` | Comunicazione HTTP con server |
| `genro.src` | `GnrSrcHandler` | Gestione ricetta/sourceNode |
| `genro.wdg` | `GnrWdgHandler` | Creazione widget |
| `genro.dev` | `GnrDevHandler` | Tools sviluppo (inspector, shortcuts) |
| `genro.dlg` | `GnrDlgHandler` | Dialogs e messaggi |
| `genro.dom` | `GnrDomHandler` | Utilities DOM |
| `genro.vld` | `GnrValidator` | Validazione dati |
| `genro.wsk` | `GnrWebSocketHandler` | WebSocket real-time |
| `genro.som` | `GnrSharedObjectHandler` | Oggetti condivisi |
| `genro.mobile` | `GnrMobileHandler` | (opzionale) Touch support |
| `genro.cordova` | `GnrCordovaHandler` | (opzionale) App native |

---

## Struttura Dati Finale

```javascript
genro
├── page_id              // ID sessione
├── startArgs            // Parametri iniziali dal server
├── _dataroot            // Container root
│   └── main             // → genro._data
├── _data                // BAG DATI principale
│   ├── gnr/             // Info sistema
│   ├── _clientCtx/      // Context persistente (cookie)
│   └── ...              // Dati applicazione
├── src._main            // BAG RICETTA (albero sourceNode)
├── rpc, src, wdg, ...   // Handler
├── widget               // Registry widget per ID
└── contextIndex         // Index per context
```

---

## Eventi Chiave

| Evento | Quando | Cosa Fa |
|--------|--------|---------|
| `onPageStart` | Fine dostart | Applicazione pronta |
| `onClosePage` | Chiusura pagina | Cleanup |
| `gnr.onStart` | Prima di onPageStart | Init custom |
| `_trigger_data` | Modifica dati | Notifica sourceNode |
| `focusedWindow` | Window focus | Tracking finestra attiva |

---

## Punti di Estensione

1. **Plugins**: `window.genro_plugin_*` → caricati in `addPlugins()`
2. **Handler custom**: Aggiungi a genro dopo init
3. **Subscribe**: `dojo.subscribe()` per eventi
4. **dataTrigger**: Hook su modifiche dati

---

## Note per Migrazione

### Da Mantenere
- Lifecycle: constructor → genroInit → start → dostart
- Handler pattern (delega a moduli specializzati)
- Due Bag (ricetta/dati)
- Sistema trigger/subscribe

### Da Modernizzare
- `dojo.declare` → ES6 class
- `dojo.subscribe/publish` → EventEmitter custom
- `dojo.connect` → addEventListener
- `dojo.hitch` → arrow functions / .bind()
- `dojo.cookie` → native API
- Timeout 1ms per async → Promise/await
