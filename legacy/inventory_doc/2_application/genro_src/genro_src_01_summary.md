# genro_src.js - Summary

**File**: `genro_src.js`
**Linee**: 652
**Dimensione**: 24 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per la gestione del Source Bag - il sistema che coordina la sincronizzazione tra GnrDomSource (struttura dichiarativa) e il DOM reale. Gestisce trigger di inserimento/aggiornamento/cancellazione, build dei nodi, e subscription system.

**Classe definita:**
- `gnr.GnrSrcHandler` - Source handler (`genro.src`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.hitch`, `dojo.query`, `dijit.byNode`, `dijit.getEnclosingWidget`
- **gnr.GnrDomSource**: Struttura sorgente DOM
- **gnr.GnrBag**: Container dati
- **genro**: Global application object

## Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento a genro |
| `_main` | GnrDomSource principale |
| `_index` | Indice nodeId → sourceNode |
| `_subscribedNodes` | Nodi con subscription attive |
| `_started` | Flag avvio completato |
| `_deletingNodeContent` | Counter delete in corso |
| `pendingBuild` | Coda build pendenti |
| `afterBuildCalls` | Callback post-build |
| `building` | Flag building in corso |
| `datatags` | Tag dati riconosciuti |
| `layouttags` | Tag layout riconosciuti |
| `highlightedNode` | Nodo evidenziato |
| `sourceRoot` | Root del source |
| `formsToUpdate` | Form da aggiornare |

### Datatags

```javascript
datatags = {
    'data': null,
    'dataformula': null,
    'datascript': null,
    'datarpc': null,
    'dataremote': null,
    'datacontroller': null
};
```

### Layouttags

```javascript
layouttags = {
    'contentpane': null,
    'bordercontainer': null,
    'stackcontainer': null,
    'tabcontainer': null,
    'accordioncontainer': null,
    'newincludedview': null,
    'framepane': null
};
```

## Metodi Principali

### Lifecycle

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(application)` | Inizializza handler e sottoscrive trigger |
| `startUp` | `(source)` | Avvia con source root |
| `getMainSource` | `(cb)` | Ottiene source principale da server |
| `updatePageSource` | `(nodeId)` | Aggiorna source da server |

### Source Navigation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `getSource` | `(path)` | Ottiene source per path |
| `getNode` | `(obj, autocreate)` | Ottiene sourceNode (da path/widget/event) |
| `setSource` | `(path, value, attr, kw)` | Imposta source |
| `delSource` | `(path)` | Elimina source |
| `newRoot` | `()` | Crea nuovo GnrDomSource |
| `nodeBySourceNodeId` | `(identifier)` | Trova nodo per _id |
| `enclosingSourceNode` | `(item)` | Risale fino a trovare sourceNode |

### Build System

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `buildNode` | `(sourceNode, where, ind)` | Costruisce nodo DOM |
| `nodeTrigger` | `(kw)` | Handler trigger source |
| `_trigger_ins` | `(kw)` | Trigger inserimento |
| `_trigger_upd` | `(kw)` | Trigger aggiornamento (rebuild) |
| `_trigger_del` | `(kw)` | Trigger cancellazione |
| `onBuiltCall` | `(cb, delay)` | Aggiunge callback post-build |

### Cleanup

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `widgetDestroyAndUnlink` | `(widget)` | Distrugge widget e rimuove link |
| `deleteDomNodeContent` | `(domNode)` | Elimina contenuto DOM |
| `deleteNodeContent` | `(sourceNode)` | Elimina contenuto sourceNode |
| `deleteChildrenExternalWidget` | `(deletingNode)` | Distrugge widget esterni figli |
| `_onDeletingContent` | `(oldvalue)` | Notifica eliminazione |

### Data Tags

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `stripData` | `(node)` | Processa nodi data |
| `stripDataNode` | `(node)` | Processa singolo nodo data |
| `moveData` | `(node)` | Sposta dati da source a genro._data |

### Index/Subscribers

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `refreshSourceIndexAndSubscribers` | `()` | Rigenera indice e subscribers |
| `checkSubscribedNodes` | `()` | Debug: verifica subscribers |

### Dynamic Parameters

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `dynamicParameters` | `(source, sourceNode)` | Risolve parametri dinamici (^, =, ==) |

### UI

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `highlightNode` | `(sourceNode)` | Evidenzia nodo |
| `onEventCall` | `(e, code, kw)` | Esegue codice su evento |
| `create` | `(widget, pars, path)` | Crea widget |

## Flusso Trigger System

```
GnrDomSource modifica
        │
        ▼
subscribe('sourceTriggers')
        │
        ▼
nodeTrigger(kw)
        │
        ├─► Se node.isFreezed() → return
        │
        ▼
pendingBuild.push(kw)
        │
        ▼
while (pendingBuild.length > 0)
        │
        ├─► _trigger_ins(kw) → buildNode()
        │
        ├─► _trigger_upd(kw) → destroy + buildNode()
        │
        └─► _trigger_del(kw) → destroy()
```

## Pattern Importanti

### Trigger Insert

```javascript
_trigger_ins: function(kw) {
    var node = kw.node;
    var where = objectPop(node.attr, '_parentDomNode');
    if (!where) {
        var wherenode = kw.where.getParentNode();
        where = wherenode.widget || wherenode.domNode;
    }
    this.buildNode(node, where, kw.ind);
}
```

### Trigger Update (Rebuild)

```javascript
_trigger_upd: function(kw) {
    // 1. Notifica deleting
    updatingNode._onDeleting();

    // 2. Distrugge widget esistente
    if (widget) {
        destination.removeChild(widget);
        widget.destroyRecursive();
    }

    // 3. Ricostruisce
    this.buildNode(kw.node, destination, ind);
}
```

### Data Stripping

```javascript
// Tag data → genro._data
stripDataNode: function(node) {
    var tag = node.attr.tag.toLowerCase();
    if (tag in this.datatags) {
        this.moveData(node);
    } else {
        // Risolve attributi dinamici (^path, =path)
        for (var attr in nodeattr) {
            if (node.isPointerPath(attrvalue)) {
                var currval = node.getAttributeFromDatasource(attr, true, dflt);
            }
        }
    }
}
```

### Dynamic Parameters

```javascript
dynamicParameters: function(source, sourceNode) {
    for (var prop in source) {
        var val = source[prop];
        if (typeof(val) == 'string' && val[0] == '=') {
            if (val.indexOf('==') == 0) {
                // Formula: eval later
            } else {
                // Path binding: risolvi ora
                path = sourceNode.absDatapath(val.slice(1));
                val = genro._data.getItem(path);
            }
        }
    }
    return obj;
}
```

### moveData - Tag Processing

```javascript
moveData: function(node) {
    var tag = node.attr.tag;

    if (tag == 'data') {
        // Sposta valore in genro._data
        genro.setData(path, value, attributes);
    }
    else if (tag == 'dataRemote') {
        // Imposta resolver remoto
        node._dataprovider = tag;
        node.setDataNodeValue();
    }
    else {
        // datacontroller, datascript, ecc.
        // Registra subscriptions
        node._dataControllerSubscription(subscriptions);
    }
}
```

## Rilevanza per genro-bag-js

⭐⭐ **MEDIA** - Questo modulo mostra come coordinare Bag/BagNode con il sistema di rendering DOM. Pattern utile per il DOMCompiler.

### Da Studiare per Architettura

- Trigger system (ins/upd/del)
- Pattern di rebuild (destroy + build)
- Index management per nodeId
- Data stripping (tag data → data store)

### Concetti da Portare

- **Trigger-based updates**: Build incrementale su modifiche
- **Index registry**: Mappatura nodeId → node
- **Dynamic parameter resolution**: Risoluzione ^path, ==formula

### Da NON Portare Direttamente

- Dipendenza Dojo
- Integrazione con genro global
- Widget-specific code (dijit)

## Note

1. **_main**: Root GnrDomSource con backref attivo
2. **pendingBuild**: Coda per gestire trigger nidificati
3. **building flag**: Previene ricorsione durante build
4. **_deletingNodeContent**: Counter per evitare refresh durante delete batch
5. **formsToUpdate**: Form che necessitano aggiornamento status

## File Correlati

- `gnrdomsource.js` - GnrDomSource/GnrDomSourceNode
- `genro_wdg.js` - Widget factory (wdg.create)
- `genro.js` - Application (crea GnrSrcHandler)
- `gnrbag.js` - Base Bag/BagNode
