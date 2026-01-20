# genro.js - Summary

**File**: `genro.js`
**Linee**: 2476
**Dimensione**: 87 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Core dell'applicazione client Genro. Contiene la classe principale `gnr.GenroClient` che coordina tutti i componenti del framework: RPC, DOM, widgets, dialogs, WebSocket, validazione.

**Classi definite:**
- `gnr.GenroClient` - Applicazione client principale (oggetto `genro`)
- `gnr.GnrClientCaller` - Resolver per callback client

## Dipendenze

- **Dojo**: `dojo.date`, `dijit.Tooltip`, `dojo.date.locale`, `dojo.currency`, `dojox.validate.web`, `dojo.number`, `dojo.cookie`, `dojo.fx`
- **gnr.GnrBag**: Container dati
- **gnr.GnrRpcHandler**: Chiamate remote
- **gnr.GnrSrcHandler**: Gestione source
- **gnr.GnrWdgHandler**: Widget factory
- **gnr.GnrDevHandler**: Developer tools
- **gnr.GnrDlgHandler**: Dialogs
- **gnr.GnrDomHandler**: DOM utilities
- **gnr.GnrValidator**: Validazione
- **gnr.GnrWebSocketHandler**: WebSocket
- **gnr.GnrSharedObjectHandler**: Shared objects
- **gnr.GnrMobileHandler**: Mobile support (opzionale)
- **gnr.GnrCordovaHandler**: Cordova support (opzionale)

## GenroClient - Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `page_id` | ID univoco pagina |
| `domRootName` | Nome elemento root DOM ('mainWindow') |
| `_data` | Bag dati principale |
| `_dataroot` | Bag root (contiene 'main' → _data) |
| `startArgs` | Parametri di avvio |
| `baseUrl` | URL base applicazione |
| `isDeveloper` | Flag modalità sviluppatore |
| `isMobile` | Flag dispositivo mobile |
| `isCordova` | Flag ambiente Cordova |
| `isMac` | Flag macOS |
| `isChrome` | Flag Chrome browser |
| `mainGenroWindow` | Window principale (per iframe) |
| `root_page_id` | Page ID root (per iframe) |
| `parent_page_id` | Page ID parent |
| `activeForm` | Form attualmente attivo |

### Handler (inizializzati in genroInit)

| Handler | Classe | Descrizione |
|---------|--------|-------------|
| `rpc` | `gnr.GnrRpcHandler` | Chiamate remote |
| `src` | `gnr.GnrSrcHandler` | Source/DOM builder |
| `wdg` | `gnr.GnrWdgHandler` | Widget factory |
| `dev` | `gnr.GnrDevHandler` | Developer tools |
| `dlg` | `gnr.GnrDlgHandler` | Dialogs |
| `dom` | `gnr.GnrDomHandler` | DOM utilities |
| `vld` | `gnr.GnrValidator` | Validazione |
| `wsk` | `gnr.GnrWebSocketHandler` | WebSocket |
| `som` | `gnr.GnrSharedObjectHandler` | Shared objects |
| `mobile` | `gnr.GnrMobileHandler` | Mobile (se isMobile) |
| `cordova` | `gnr.GnrCordovaHandler` | Cordova (se isCordova) |

## Lifecycle

```
constructor → genroInit (dopo 1ms) → start (dopo dojo.addOnLoad) → dostart
```

### constructor
- Inizializza configurazione
- Crea contatori e timestamp
- Sottoscrive eventi globali
- Chiama `genroInit` dopo 1ms

### genroInit
- Crea handler (rpc, src, wdg, dev, dlg, dom, vld, wsk, som)
- Configura eventi beforeunload/pagehide
- Applica patch Dojo
- Imposta `clsdict` per parsing XML

### start
- Crea `_dataroot` e `_data` (Bag)
- Crea WebSocket
- Richiede main source dal server
- Gestisce redirect se necessario

### dostart
- Carica context da cookie
- Avvia builder DOM
- Registra eventi utente
- Configura keyboard shortcuts
- Avvia polling automatico
- Pubblica 'onPageStart'

## Metodi - Dati

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getData` | `(path, dflt, cb)` | Ottiene dati da _data |
| `setData` | `(path, value, attributes, doTrigger)` | Imposta dati in _data |
| `getDataNode` | `(path, autocreate, dflt)` | Ottiene BagNode |
| `getDataAttr` | `(path, attr, dflt)` | Ottiene attributo nodo |
| `_` | `(path, dflt)` | Shortcut per getRelativeData |
| `fireEvent` | `(path, msg)` | Fire evento (set + set null) |
| `fireAfter` | `(path, msg, timeout)` | Fire con delay |
| `setDataAfter` | `(path, value, timeout)` | Set con delay |
| `resetData` | `(path)` | Reset a _loadedValue |
| `copyData` | `(path, sourcepath, changebackref)` | Copia nodo |
| `dataSubscribe` | `(path, subscriberId, kwargs)` | Sottoscrive a path |
| `dataTrigger` | `(kw)` | Handler trigger dati |
| `fireDataTrigger` | `(path)` | Forza trigger su path |

## Metodi - Navigazione

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `nodeById` | `(nodeId, scope)` | Trova nodo per ID |
| `wdgById` | `(nodeId, scope)` | Trova widget per ID |
| `domById` | `(nodeId, scope)` | Trova DOM per ID |
| `formById` | `(formId)` | Trova form handler |
| `getForm` | `(frameCode)` | Ottiene form da frame |
| `getFrameNode` | `(frameCode, side)` | Ottiene nodo frame |
| `getSourceNode` | `(obj)` | Wrapper per src.getNode |
| `getChildWindow` | `(page_id)` | Trova window figlia |
| `getParentGenro` | `()` | Ottiene genro parent |

## Metodi - URL e Navigazione

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `gotoURL` | `(url, relative)` | Naviga a URL |
| `gotoHome` | `()` | Va a homepage |
| `goBack` | `()` | Torna indietro nel path |
| `pageBack` | `()` | history.back() |
| `pageReload` | `(params, replaceParams)` | Ricarica pagina |
| `makeUrl` | `(url, kwargs)` | Costruisce URL completo |
| `absoluteUrl` | `(url, kwargs, avoidCache)` | URL assoluto |
| `addParamsToUrl` | `(url, params)` | Aggiunge parametri |
| `constructUrl` | `(path, params)` | Costruisce URL relativo |
| `addKwargs` | `(url, kwargs)` | Aggiunge kwargs a URL |

## Metodi - RPC e Server

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `serverCall` | `(method, params, async_cb, mode, httpMethod)` | Chiamata server |
| `remoteJson` | `(method, params)` | Chiamata con risposta JSON |
| `remoteUrl` | `(method, args, sourceNode, avoidCache)` | URL per RPC |
| `setInServer` | `(path, value, pageId)` | Set valore su server |
| `ping` | `()` | Ping server |
| `login` | `(data, kw)` | Login utente |
| `logout` | `()` | Logout |

## Metodi - Download e Finestre

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `download` | `(url, args, onload_cb)` | Download via iframe |
| `triggerDownload` | `(url, args, onload_cb)` | Download via link |
| `triggerPrint` | `(url, args)` | Stampa via iframe |
| `rpcDownload` | `(method, kwargs, onload_cb)` | Download via RPC |
| `openWindow` | `(url, name, params)` | Apre nuova finestra |
| `openBrowserTab` | `(url, params)` | Apre nuovo tab |
| `childBrowserTab` | `(url, parent_page_id, params)` | Tab con parent |
| `viewPDF` | `(filename, forcedownload)` | Visualizza PDF |

## Metodi - Publish/Subscribe

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `publish` | `(topic, kw)` | Pubblica evento (supporta routing complesso) |
| `subscribeEvent` | `(object, eventname, obj, func)` | Sottoscrivi evento widget |

### publish routing

```javascript
// Semplice
genro.publish('myTopic', {data: value});

// Complesso
genro.publish({
    topic: 'myTopic',
    nodeId: 'targetNode',  // pubblica su nodo specifico
    form: 'formId',        // pubblica su form
    iframe: '*' | 'frameId',  // propaga a iframe
    parent: true,          // propaga a parent
    extWin: 'windowKey'    // propaga a external window
}, kw);
```

## Metodi - Utility

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `callAfter` | `(cb, timeout, scope, reason)` | Chiamata ritardata (debounce) |
| `watch` | `(watchId, conditionCb, action, delay)` | Polling su condizione |
| `unwatch` | `(watchId)` | Rimuove watch |
| `getCounter` | `(what, reset)` | Contatore incrementale |
| `time36Id` | `()` | ID univoco base36 |
| `compare` | `(op, a, b)` | Confronto con operatore |
| `isEqual` | `(a, b)` | Uguaglianza (supporta Date) |
| `evaluate` | `(expr, showError)` | Valuta espressione JS |
| `format` | `(v, f, m)` | Formatta valore |
| `assert` | `(condition, msg, level)` | Assertion con log |

## Metodi - Storage

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `setInStorage` | `(storageType, key, value, nameSpace)` | Salva in session/localStorage |
| `getFromStorage` | `(storageType, key, nameSpace)` | Legge da storage |
| `saveContextCookie` | `()` | Salva context in cookie |
| `loadContext` | `()` | Carica context da cookie |

## Metodi - Preferenze

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `userPreference` | `(pref)` | Legge preferenza utente |
| `appPreference` | `(pref)` | Legge preferenza app |
| `setUserPreference` | `(path, data, pkg)` | Salva preferenza utente |
| `setAppPreference` | `(path, data)` | Salva preferenza app |

## Metodi - UI

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `lockScreen` | `(locking, reason, options)` | Blocca/sblocca schermo |
| `resizeAll` | `()` | Forza resize root |
| `fakeResize` | `()` | Dispatch evento resize |
| `playSound` | `(name, path, ext)` | Riproduce suono |
| `playUrl` | `(url, onEnd)` | Riproduce audio da URL |
| `textToClipboard` | `(txt, cb)` | Copia in clipboard |
| `closePage` | `()` | Chiude pagina/iframe |

## Metodi - Form

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getFormData` | `(formId)` | Dati form |
| `getFormChanges` | `(formId)` | Modifiche form |
| `getFormCluster` | `(formId)` | Cluster form |
| `formInfo` | `(name)` | Info form |
| `invalidFields` | `(name)` | Campi invalidi |
| `hasPendingChanges` | `()` | Verifica modifiche pendenti |
| `checkBeforeUnload` | `()` | Conferma prima di uscire |

## Metodi - Validazione

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `dataValidate` | `(databag, sourceNode)` | Valida databag |
| `focusOnError` | `(databag, sourceNode)` | Focus su primo errore |
| `_invalidNodes` | `(databag, sourceNode)` | Lista nodi invalidi |

## User Events

Il sistema traccia eventi utente per:
- Ping automatico basato su attività
- Screen lock timeout
- Fast polling quando attivo

```javascript
genro._lastUserEventTs      // Ultimo evento questa pagina
genro._lastChildUserEventTs // Ultimo evento iframe figlie
genro._lastGlobalUserEventTs // Massimo tra i due
```

## Keyboard Shortcuts (default)

| Shortcut | Azione |
|----------|--------|
| `Ctrl+Shift+D` | Inspector |
| `Ctrl+Shift+I` | Inspector |
| `Ctrl+Shift+S` | Screenshot |
| `Ctrl+D` / `Cmd+D` | Duplicate command |
| `Shift+Space` | Copy from cell above / last saved value |
| `F1` | Form save |
| `F3` | Print |

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo è il core dell'applicazione Genro completa, non direttamente rilevante per genro-bag-js.

### Concetti Utili

- Pattern applicazione client con handler modulari
- Sistema publish/subscribe
- Watch/callAfter per operazioni async
- Context management via cookie

### Da NON Portare

- Tutto - questo è l'applicazione, non la libreria Bag
- Le parti rilevanti (Bag) sono in gnrbag.js

## Note

1. **clsdict**: `{domsource: gnr.GnrDomSource, bag: gnr.GnrBag}` per parsing XML
2. **compareDict**: Operatori per confronti (`==`, `>`, `<`, `%` contiene, etc.)
3. **Iframe hierarchy**: Gestione complessa di iframe annidati con mainGenroWindow
4. **Server store**: Sincronizzazione path con server via `_serverstore_paths`
5. **Shared objects**: Sincronizzazione real-time via `_sharedObjects_paths`

## File Correlati

- `gnrbag.js` - GnrBag (usato per _data)
- `gnrdomsource.js` - GnrDomSource (per source)
- `genro_rpc.js` - GnrRpcHandler
- `genro_src.js` - GnrSrcHandler
- `genro_wdg.js` - GnrWdgHandler
- `genro_dom.js` - GnrDomHandler
- `genro_dlg.js` - GnrDlgHandler
- `genro_dev.js` - GnrDevHandler
- `genro_frm.js` - GnrFrmHandler
- `gnrwebsocket.js` - GnrWebSocketHandler
- `gnrsharedobjects.js` - GnrSharedObjectHandler
