# Architettura Genropy Client-Side

## Overview

Genropy è un framework per la creazione di Single Page Applications (SPA) dove:
- Il **server Python** genera una "ricetta" dichiarativa dell'interfaccia
- Il **client JavaScript** costruisce il DOM dalla ricetta e gestisce il data binding

## Flusso di Bootstrap

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. RICHIESTA BROWSER                                               │
│     URL: app.example.com/pkg_myapp/page_main                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. SERVER PYTHON                                                   │
│     - Trova package "pkg_myapp" e pagina "page_main"                │
│     - Genera HTML bootstrap con:                                    │
│       • Link a JS/CSS necessari                                     │
│       • page_id (identificatore sessione)                           │
│       • startArgs (path, query string, user info, etc.)             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. BROWSER ESEGUE BOOTSTRAP                                        │
│     <script>                                                        │
│       genro = new gnr.GenroClient({                                 │
│         page_id: "abc123",                                          │
│         startArgs: {path: "/pkg_myapp/page_main", ...}              │
│       });                                                           │
│     </script>                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. INIZIALIZZAZIONE GENRO                                          │
│     constructor() → genroInit() → start()                           │
│                                                                     │
│     Crea gli Handler:                                               │
│     • genro.rpc  → comunicazione server                             │
│     • genro.src  → gestione ricetta/sourceNode                      │
│     • genro.wdg  → creazione widget                                 │
│     • genro.dom  → utilities DOM                                    │
│     • genro.dlg  → dialogs                                          │
│     • genro.wsk  → WebSocket                                        │
│                                                                     │
│     Crea le DUE BAG:                                                │
│     • genro._data     → BAG DATI                                    │
│     • genro.src._main → BAG RICETTA (sourceNode tree)               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. RICHIESTA RICETTA AL SERVER                                     │
│     genro.src.getMainSource() → RPC call                            │
│                                                                     │
│     Server risponde con:                                            │
│     {                                                               │
│       _value: <Bag ricetta XML>,                                    │
│       attr: {embedded_data: <Bag dati>, ...}                        │
│     }                                                               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. BUILD DELL'INTERFACCIA                                          │
│     genro.src.startUp(mainBagPage)                                  │
│                                                                     │
│     - Ricetta → genro.src._main (BAG RICETTA)                       │
│     - Dati embedded → genro._data (BAG DATI)                        │
│     - Per ogni nodo ricetta: crea widget/DOM con binding            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. APPLICAZIONE PRONTA                                             │
│     - DOM costruito                                                 │
│     - Widget collegati ai dati                                      │
│     - Eventi WebSocket attivi                                       │
│     - Pubblica evento 'onPageStart'                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Le Due Bag

Il cuore di Genropy sono due strutture dati gerarchiche (Bag):

### BAG DATI (`genro._data`)

Contiene lo **stato dell'applicazione**:

```
genro._data
├── gnr/                    # Info sistema
│   ├── locale              # "it_IT"
│   ├── user                # info utente
│   └── ...
├── _clientCtx/             # Context persistente (cookie)
├── tables/                 # Dati da database
│   └── customer/
│       ├── record          # Record corrente
│       └── selection       # Selezione corrente
└── [paths applicazione]    # Dati custom
    ├── form/
    │   └── myfield         # "valore campo"
    └── filters/
        └── status          # "active"
```

### BAG RICETTA (`genro.src._main`)

Contiene la **descrizione dell'interfaccia** come albero di sourceNode:

```
genro.src._main
└── _gnrRoot                     # Root container
    └── BorderContainer
        ├── top/
        │   └── Toolbar
        │       └── Button {label: "Salva", action: "..."}
        ├── left/
        │   └── Tree {storepath: ".categories"}
        └── center/
            └── Form
                ├── TextBox {value: "^.form.name"}
                ├── NumberTextBox {value: "^.form.amount"}
                └── FilteringSelect {value: "^.form.status"}
```

## Sistema di Binding

### Sintassi `^path`

Il prefisso `^` indica un **binding reattivo bidirezionale**:

```javascript
// Nella ricetta:
TextBox({value: '^.form.name'})

// Significa:
// 1. Valore iniziale = genro._data.getItem('.form.name')
// 2. Se l'utente modifica il TextBox → aggiorna genro._data
// 3. Se genro._data cambia → aggiorna il TextBox
```

### Tipi di Binding

| Prefisso | Tipo | Direzione | Esempio |
|----------|------|-----------|---------|
| `^` | Subscribe | dato→widget | `value: '^.name'` |
| `=` | Formula | calcolato | `visible: '=.count > 0'` |
| (nessuno) | Statico | una volta | `label: 'Salva'` |

### Path Relativi e Assoluti

```javascript
// Path assoluto (da root _data)
'^tables.customer.record.name'

// Path relativo (da datapath corrente del widget)
'^.name'        // equivale a datapath + '.name'
'^..parent'     // risale di un livello
```

## Componenti Principali

### genro.js - Application Core

Entry point e orchestratore:
- Bootstrap e lifecycle
- Accesso ai dati (`getData`, `setData`)
- Event bus (`publish`, `subscribe`)
- Facade per tutti gli handler

### genro_src.js - Source Handler

Gestisce la BAG RICETTA:
- Costruzione albero sourceNode
- Build del DOM dalla ricetta
- Gestione ciclo vita dei nodi

### gnrdomsource.js - GnrDomSource

Classe che rappresenta un **sourceNode**:
- Nodo nell'albero ricetta
- Collegamento a widget/DOM
- Gestione binding e trigger
- Attributi dinamici

### genro_wdg.js - Widget Handler

Sistema di creazione widget:
- Registry dei tipi widget
- Lifecycle: `creating()` → `created()` → `destroying()`
- Mixin per attributi reattivi

### gnrbag.js - Bag Core

Struttura dati gerarchica:
- `GnrBag` - contenitore
- `GnrBagNode` - nodo singolo
- Navigazione per path
- Serializzazione XML/JSON
- Sistema di trigger su modifiche

## Flusso Dati

```
┌─────────────┐     trigger      ┌─────────────┐
│  BAG DATI   │ ───────────────► │ sourceNode  │
│ genro._data │                  │             │
└─────────────┘                  └──────┬──────┘
      ▲                                 │
      │                                 │ aggiorna
      │ setItem()                       ▼
      │                          ┌─────────────┐
      │                          │   Widget    │
      │                          │   (DOM)     │
      └────────────────────────  └─────────────┘
              onChange event
```

1. **Dato cambia** → Bag emette trigger
2. **Trigger** → sourceNode riceve notifica
3. **sourceNode** → aggiorna widget/DOM
4. **Utente interagisce** → widget emette evento
5. **Evento** → sourceNode aggiorna Bag
6. **Ciclo ricomincia**

## Moduli per Categoria

### 1. Core (Fondamentali)
- `gnrbag.js` - Bag e BagNode
- `gnrlang.js` - Utilities JavaScript
- `gnrdomsource.js` - GnrDomSource (sourceNode)

### 2. Application
- `genro.js` - Entry point
- `genro_src.js` - Source handler
- `genro_rpc.js` - Comunicazione server

### 3. Data
- `gnrstores.js` - Store per grid/tree
- `gnrwebsocket.js` - Real-time sync
- `gnrsharedobjects.js` - Oggetti condivisi

### 4. Widget System
- `genro_wdg.js` - Widget handler
- `genro_widgets.js` - Definizioni widget
- `genro_components.js` - Componenti complessi
- `genro_dom.js` - Utilities DOM

### 5. UI Specializzata
- `genro_frm.js` - Form
- `genro_grid.js` - Grid
- `genro_tree.js` - Tree
- `genro_dlg.js` - Dialog

### 6. Platform
- `genro_mobile.js` - Touch support
- `genro_cordova.js` - App native
- `genro_google.js` - Google services

### 7. Tools
- `genro_dev.js` - Dev tools
- `genro_patch.js` - Dojo patches

## Glossario

| Termine | Descrizione |
|---------|-------------|
| **Bag** | Struttura dati gerarchica (albero) |
| **BagNode** | Singolo nodo di una Bag |
| **sourceNode** | Nodo nella BAG RICETTA, collegato a widget |
| **Ricetta** | Descrizione dichiarativa dell'UI |
| **Binding** | Collegamento reattivo dato↔widget |
| **Trigger** | Evento emesso quando un dato cambia |
| **Handler** | Modulo che gestisce un'area funzionale |
| **datapath** | Percorso corrente nel contesto di un widget |

## Note per la Migrazione

### Da Mantenere
- Architettura a due Bag (ricetta/dati)
- Sistema di binding `^` e `=`
- Costruzione dichiarativa UI
- Reattività bidirezionale

### Da Modernizzare
- Rimuovere dipendenza Dojo
- JavaScript moderno (ES2020+)
- ES Modules invece di global
- Moduli più piccoli e specializzati
- Testing automatizzato
