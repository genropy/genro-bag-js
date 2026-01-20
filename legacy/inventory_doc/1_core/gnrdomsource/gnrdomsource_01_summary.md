# gnrdomsource.js - Summary

**File**: `gnrdomsource.js`
**Linee**: 2099
**Dimensione**: 80 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Estende GnrBag/GnrBagNode con funzionalità specifiche per il DOM e i widget Genro. Implementa il "Compiler" che trasforma la struttura dati Bag in elementi DOM reali.

**Classi definite:**
- `gnr.GnrDomSourceNode` - Estende `gnr.GnrBagNode` per nodi DOM
- `gnr.GnrStructData` - Estende `gnr.GnrBag` per dati strutturati
- `gnr.GnrDomSource` - Estende `gnr.GnrStructData` per sorgenti DOM

## Dipendenze

- **gnr.GnrBagNode**: Classe base per GnrDomSourceNode
- **gnr.GnrBag**: Classe base per GnrStructData/GnrDomSource
- **Dojo**: `dojo.declare`, `dojo.hitch`, `dojo.connect`, `dojo.subscribe`, `dojo.publish`, `dojo.query`, `dijit`
- **genro**: Oggetto applicazione globale (rpc, wdg, dom, src, formatter)
- **gnrlang.js**: Utility functions

## GnrDomSourceNode - Metodi Chiave

### Navigazione Widget/DOM

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getDomNode` | `()` | Ottiene DOM node (widget.domNode o this.domNode) |
| `getWidget` | `(notEnclosed)` | Ottiene widget Dijit associato |
| `getBuiltObj` | `()` | Ottiene widget o domNode |
| `getParentWidget` | `(tagToFind)` | Risale gerarchia cercando widget |
| `getParentBuiltObj` | `()` | Ottiene built object del parent |
| `getFormHandler` | `()` | Ottiene form handler dalla gerarchia |
| `getFrameNode` | `()` | Risale fino a trovare framepane |

### Datapath e Data Binding

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `absDatapath` | `(path)` | Risolve path relativo a assoluto |
| `symbolicDatapath` | `(path)` | Risolve path simbolici (#nodeId, #WORKSPACE, #DATA, #ROW) |
| `attrDatapath` | `(attrname, targetNode)` | Ottiene datapath di un attributo |
| `isPointerPath` | `(path)` | Verifica se path inizia con ^ o = |
| `getRelativeData` | `(path, autocreate, dflt)` | Ottiene dati relativi al nodo |
| `setRelativeData` | `(path, value, attr, fired, reason, delay)` | Imposta dati relativi |
| `fireEvent` | `(path, value, attr, reason, delay)` | Fire event su path |
| `getAttributeFromDatasource` | `(attrname, autocreate, dflt)` | Ottiene attributo risolvendo binding |
| `setAttributeInDatasource` | `(attrname, value, doTrigger, attr, force)` | Imposta attributo in datasource |
| `currentFromDatasource` | `(value, autocreate, dflt)` | Risolve valore da datasource (^ o ==) |

### Build System

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `build` | `(destination, ind)` | Costruisce DOM da questo nodo |
| `rebuild` | `()` | Ricostruisce il nodo |
| `_buildChildren` | `(destination)` | Costruisce nodi figli |
| `_doBuildNode` | `(tag, attributes, destination, ind)` | Esegue build effettivo |
| `_registerNodeId` | `(nodeId)` | Registra nodeId in genro.src._index |
| `_registerInForm` | `()` | Registra nodo nel form handler |
| `buildLblWrapper` | `()` | Costruisce wrapper per label |
| `lazyBuildFinalize` | `(widget)` | Finalizza lazy build |
| `destroy` | `()` | Distrugge widget/domNode |

### Build Tags Speciali

| Metodo | Tag | Descrizione |
|--------|-----|-------------|
| `_bld_data` | data | Placeholder |
| `_bld_dataremote` | dataremote | Remote data |
| `_bld_dataformula` | dataformula | Formula calcolata |
| `_bld_datascript` | datascript | Script JavaScript |
| `_bld_datacontroller` | datacontroller | Controller logico |
| `_bld_datarpc` | datarpc | Chiamata RPC |
| `_bld_script` | script | Carica/esegue script |
| `_bld_stylesheet` | stylesheet | Carica CSS |
| `_bld_css` | css | Aggiunge regole CSS |
| `_bld_remote` | remote | Contenuto remoto |

### Trigger e Data Binding

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `trigger_data` | `(prop, kw)` | Gestisce trigger su attributo |
| `getTriggerReason` | `(pathToCheck, kw)` | Determina tipo trigger (node/container/child) |
| `setDataNodeValue` | `(nodeOrRunKwargs, kw, trigger_reason, subscription_args)` | Esegue azione su trigger |
| `setDataNodeValueDo` | `(...)` | Implementazione effettiva |
| `fireNode` | `(runKwargs, kw, trigger_reason)` | Fire node action |
| `updateAttrBuiltObj` | `(attr, kw, trigger_reason)` | Aggiorna attributo built object |
| `doUpdateAttrBuiltObj` | `(attr, kw, trigger_reason)` | Implementazione update |

### Dynamic Attributes

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `registerDynAttr` | `(attr)` | Registra attributo dinamico |
| `registerNodeDynAttr` | `(returnCurrentValues)` | Registra tutti attributi dinamici |
| `_resetDynAttributes` | `()` | Reset attributi dinamici |
| `_setDynAttributes` | `()` | Imposta subscription per attributi dinamici |
| `hasDynamicAttr` | `(attr)` | Verifica se attributo è dinamico |
| `currentAttributes` | `()` | Ottiene tutti attributi correnti risolti |
| `evaluateOnNode` | `(pardict, filterCb)` | Valuta parametri relativi al nodo |

### Subscription/Publish

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `registerSubscription` | `(topic, scope, handler, reason)` | Registra subscription |
| `unregisterSubscription` | `(reason)` | Rimuove subscription |
| `subscribe` | `(command, handler, subscriberNode)` | Sottoscrive a comando self |
| `publish` | `(msg, kw, recursive)` | Pubblica messaggio |
| `connect` | `(target, eventname, handler)` | Connette handler a evento |

### Remote Content

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `updateRemoteContent` | `(forceUpdate, async)` | Aggiorna contenuto remoto |
| `setRemoteContent` | `(kwargs)` | Imposta resolver per contenuto remoto |
| `mergeRemoteContent` | `(value)` | Merge contenuto remoto |
| `replaceContent` | `(value)` | Sostituisce contenuto |
| `updateContent` | `(kw)` | Aggiorna contenuto da resolver |

### Validation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `setValidations` | `()` | Inizializza validazioni |
| `hasValidations` | `()` | Verifica se ha validazioni |
| `hasValidationError` | `()` | Verifica errori validazione |
| `hasValidationWarnings` | `()` | Verifica warning validazione |
| `isValidationRequired` | `()` | Verifica se campo required |
| `getValidationError` | `()` | Ottiene errore validazione |
| `getValidationWarnings` | `()` | Ottiene warnings |
| `setValidationError` | `(validation_result)` | Imposta errore |
| `resetValidationError` | `()` | Reset errore |
| `updateValidationStatus` | `(kw)` | Aggiorna stato widget |
| `updateValidationClasses` | `()` | Aggiorna classi CSS validazione |

### State Management

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `freeze` | `()` | Congela nodo (no rebuild) |
| `unfreeze` | `(noRebuild)` | Scongela nodo |
| `isFreezed` | `()` | Verifica se congelato (anche parent) |
| `setDisabled` | `(reason)` | Disabilita widget |
| `isDisabled` | `()` | Verifica se disabilitato |
| `setHidden` | `(hidden)` | Nasconde/mostra elemento |
| `setHiderLayer` | `(set, kw)` | Imposta layer di copertura |

### Utility

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `watch` | `(watchId, conditionCb, action, delay)` | Polling su condizione |
| `unwatch` | `(watchId)` | Rimuove watch |
| `delayedCall` | `(cb, delay, code)` | Chiamata ritardata |
| `nodeById` | `(nodeId)` | Cerca nodo per ID |
| `wdgById` | `(nodeId)` | Cerca widget per ID |
| `domById` | `(nodeId)` | Cerca DOM per ID |
| `getPathId` | `()` | Hash del fullpath |
| `setGnrId` | `(gnrId, obj)` | Imposta ID globale |
| `defineForm` | `(formId, formDatapath, ...)` | Definisce form handler |
| `getElementLabel` | `()` | Ottiene label elemento |
| `inheritedAttribute` | `(attr)` | Ottiene attributo ereditato |
| `_` | `(tag, name, attributes, extrakw)` | Shortcut per creare child |
| `setSource` | `(path, source)` | Imposta source a path |
| `getChild` | `(childpath)` | Ottiene child per path |
| `copyInClipboard` | `(path)` | Copia valore in clipboard |
| `pasteFromClipboard` | `(path, mode)` | Incolla da clipboard |

### Helper System

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `onHelperClick` | `(helperButtonNode)` | Click su helper button |
| `saveHelper` | `(value, custom)` | Salva helper value |
| `getHelperValue` | `()` | Ottiene helper value |
| `getHelperPath` | `(custom)` | Path per helper |
| `getHelperFolder` | `(custom)` | Folder per helper |
| `updateHelperClasses` | `()` | Aggiorna classi helper |

## GnrDomSource - Metodi

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `_` | `(tag, name, attributes, extrakw)` | Crea child node (Builder pattern) |
| `component` | `()` | Ottiene componente |
| `getChild` | `(childpath)` | Naviga figli per path (parent/#nodeId/childname) |

## Path Simbolici (#)

| Prefix | Esempio | Descrizione |
|--------|---------|-------------|
| `#nodeId` | `#myForm.value` | Riferimento a nodo per ID |
| `#WORKSPACE` | `#WORKSPACE.myvar` | Workspace del nodo |
| `#DATA` | `#DATA.path` | Path assoluto dati |
| `#ROW` | `#ROW.field` | Riga corrente (in grid) |

## Pointer Path (^ e =)

| Prefix | Esempio | Descrizione |
|--------|---------|-------------|
| `^` | `^.value` | Data binding bidirezionale |
| `=` | `=.formula` | Binding one-way |
| `==` | `==expr` | Formula calcolata inline |

## Rilevanza per genro-bag-js

⭐⭐ **MEDIA** - Questo modulo è specifico per Genro UI/DOM ma illustra come si estende Bag per creare il "Compiler" che produce DOM.

### Da Studiare per Architettura

- Pattern di estensione BagNode → DomSourceNode
- Sistema di build con `_bld_*` methods
- Data binding con `^` e `==` prefix
- Subscription/trigger per reattività

### Da NON Portare Direttamente

- Dipendenze Dojo/Dijit
- Integrazione con genro globale
- Specifiche UI (validation, disabled, hidden)
- Remote content (specifico Genro RPC)

### Concept da Portare

- **DOMCompiler** come estensione di Bag/BagNode
- Pattern `_` per Builder fluent API
- Data binding reattivo
- Lazy build pattern

## Note

1. **_nodeFactory**: GnrDomSource usa `gnr.GnrDomSourceNode` come factory per nodi
2. **_validationPrefix**: `structvalidate_` per validazioni struttura
3. **Mobile support**: Constructor estrae `mobile_*` attributes
4. **Trigger reason**: 'node', 'container', 'child' per diversi tipi di trigger
5. **Formula attributes**: `_formulaAttributes` per attributi con `==` prefix

## Pattern Importanti

### Builder Pattern (_)
```javascript
source._('div', 'container', {class: 'main'})
      ._('span', 'label', {innerHTML: '^.text'});
```

### Data Binding
```javascript
// Bidirezionale
{value: '^.fieldname'}

// One-way
{disabled: '=.isReadonly'}

// Formula
{total: '==price * quantity'}
```

### Watch Pattern
```javascript
this.watch('myCondition',
    function() { return someCondition(); },
    function() { doSomething(); },
    200 // delay ms
);
```

## File Correlati

- `gnrbag.js` - Classi base GnrBag/GnrBagNode
- `genro_wdg.js` - Widget handler (genro.wdg.create)
- `genro_src.js` - Source handler (genro.src)
- `gnrlang.js` - Utility functions
