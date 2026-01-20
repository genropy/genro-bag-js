# genro_tree.js - Summary

**File**: `genro_tree.js`
**Linee**: 974
**Dimensione**: 40 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per il widget Tree in Genro. Estende dijit.Tree con supporto per GnrBag come data store, checkbox tree, ricerca/filtro, e binding dati bidirezionale.

**Classe definita:**
- `gnr.widgets.Tree` - Tree widget handler (`gnr.widgets.baseDojo`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.require("dijit.Tree")`, `dijit.tree.ForestStoreModel`
- **gnr.GnrStoreBag**: Store adapter per Bag
- **gnr.GnrBag/GnrBagNode**: Container dati
- **genro**: Global application object

## Proprietà Widget

| Proprietà | Descrizione |
|-----------|-------------|
| `_domtag` | 'div' |
| `_dojotag` | 'Tree' |
| `model` | dijit.tree.ForestStoreModel con GnrStoreBag |
| `checkBoxTree` | Flag per checkbox mode |
| `currentSelectedNode` | Nodo attualmente selezionato |
| `_filteringValue` | Valore filtro ricerca attivo |
| `_itemNodeMap` | Mappa id → treeNode |

## Metodi Principali

### Lifecycle

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `onBuilding` | `(sourceNode)` | Hook pre-build (searchOn, popup) |
| `onBuilding_searchOn` | `(sourceNode)` | Configura searchbox integrato |
| `onBuilding_popup` | `(sourceNode)` | Configura tree in popup menu |
| `creating` | `(attributes, sourceNode)` | Pre-processing (store, model) |
| `created` | `(widget, savedAttrs, sourceNode)` | Post-creazione (tooltip, search subscription) |

### Navigation/Selection

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_setSelected` | `(node, e)` | Imposta nodo selezionato |
| `mixin_setSelectedPath` | `(path, kw)` | Seleziona per path |
| `mixin__updateSelect` | `(item, node)` | Aggiorna binding selezione |
| `mixin_showNodeAtPath` | `(path)` | Mostra/espande fino a path |
| `mixin_isSelectedItem` | `(item)` | Verifica se item è selezionato |

### Expand/Collapse

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_collapseAll` | `(curr, exceptNode)` | Collassa tutti i nodi |
| `mixin_expandAll` | `(rootNode, recurse)` | Espande tutti i nodi |
| `mixin_saveExpanded` | `()` | Salva stato espansione |
| `mixin_restoreExpanded` | `()` | Ripristina stato espansione |

### Checkbox Tree

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_clickOnCheckbox` | `(bagnode, e)` | Gestisce click su checkbox |
| `mixin_updateCheckedAttr` | `()` | Aggiorna attributi checked |
| `mixin_setCheckedPaths` | `(path, kw)` | Imposta checked da paths |
| `attributes_mixin_checkBoxCalcStatus` | `(bagnode)` | Calcola stato checkbox (on/off/-1) |

### Search/Filter

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_applyFilter` | `(search_kw)` | Applica filtro ricerca |
| `mixin_stopApplyFilter` | `()` | Interrompe filtro async |

### Store/Data

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_setStorepath` | `(val, kw)` | Handler trigger storepath |
| `mixin_setDynamicStorepath` | `(newstorepath)` | Cambia storepath dinamicamente |
| `mixin_storebag` | `()` | Ottiene Bag dati |
| `mixin_getItemById` | `(id)` | Trova item per ID |
| `mixin_updateLabels` | `()` | Aggiorna label visualizzate |

### Drag & Drop

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `fillDragInfo` | `(dragInfo)` | Riempie info drag |
| `fillDropInfo` | `(dropInfo)` | Riempie info drop |
| `onDragStart` | `(dragInfo)` | Gestisce inizio drag |

## Pattern Importanti

### GnrStoreBag per Tree

```javascript
creating: function(attributes, sourceNode) {
    dojo.require("dijit.Tree");

    var storepath = sourceNode.absDatapath(attributes.storepath);
    var store = new gnr.GnrStoreBag({
        datapath: storepath,
        _identifier: attributes.identifier || '#id',
        hideValues: attributes.hideValues,
        labelAttribute: attributes.labelAttribute,
        labelCb: funcCreate(attributes.labelCb, null, sourceNode),
        hasChildrenCb: funcCreate(attributes.hasChildrenCb, null, sourceNode),
        nodeFilter: funcCreate(attributes.nodeFilter, null, sourceNode),
        sourceNode: sourceNode
    });

    var model = new dijit.tree.ForestStoreModel({
        store: store,
        childrenAttrs: ["#v"]  // Usa valore Bag come children
    });

    attributes.model = model;
    attributes.showRoot = false;
}
```

### Checkbox Tree

```javascript
mixin_clickOnCheckbox: function(bagnode, e) {
    // Stato disabled
    if(bagnode.attr.checked=='disabled:on' || bagnode.attr.checked=='disabled:off'){
        return;
    }

    var checked = bagnode.attr.checked ? false : true;

    // Aggiorna ricorsivamente i figli
    var updBranchCheckedStatus = function(bag) {
        bag.forEach(function(n) {
            var v = n.getValue(walkmode);
            if ((v instanceof gnr.GnrBag) && v.len()) {
                updBranchCheckedStatus(v);
                // Calcola stato: all checked, all unchecked, o mixed (-1)
                var checkedStatus = dojo.every(v.getNodes(), function(cn) {
                    return cn.attr.checked === true;
                });
                if (!checkedStatus) {
                    checkedStatus = dojo.every(v.getNodes(), function(cn) {
                        return cn.attr.checked === false;
                    }) ? false : -1;
                }
                n.setAttr({'checked':checkedStatus}, true, true);
            } else {
                n.setAttr({'checked':checked}, true, true);
            }
        });
    };

    // Aggiorna anche i parent
    var parentNode = bagnode.getParentNode();
    while (parentNode && (parentNode._id != rootNodeId)) {
        parentNode.setAttr({'checked':this.checkBoxCalcStatus(parentNode)}, true, true);
        parentNode = parentNode.getParentNode();
    }
}
```

### Search Filter con Async

```javascript
mixin_applyFilter: function(search_kw) {
    var search = this._filteringValue;
    var filterRegExp = new RegExp('('+search+')','ig');

    // Funzione match
    var cb_match = function(n) {
        var label = searchColumn ? n.attr[searchColumn] : that.getLabel(n);
        return label.match(filterRegExp);
    };

    // forEach asincrono per resolver lazy
    var filterForEach = function(b, cb, mode) {
        b.forEach(function(n) {
            if(mode=='async' && n.getResolver() && n.getResolver().expired()) {
                // Carica lazy e continua
                var deferred = n.getValue(null, {rpc_sync:false});
                that._pending_deferred[token] = {deferred:deferred, bagNode:n};
                deferred.addCallback(function(result) {
                    filterForEach(result, cb, 'async');
                    showResult();
                });
            } else {
                var v = n.getValue();
                if(v instanceof gnr.GnrBag) {
                    filterForEach(v, cb, mode);
                } else {
                    cb(n);
                }
            }
        });
    };

    // Mostra risultati con highlight
    var showResult = function() {
        treeNodes.addClass('hidden');
        treeNodes.forEach(function(n) {
            if(cb_match(tn.item)) {
                dojo.removeClass(tn.domNode, 'hidden');
                tn.labelNode.innerHTML = label.replace(filterRegExp,
                    "<span class='search_highlight'>$1</span>");
            }
        });
    };
}
```

### Selection Binding

```javascript
mixin__updateSelect: function(item, node) {
    var root = this.model.store.rootData();
    var itemFullPath = item.getFullpath(null, root);

    // Bind a selectedLabel
    if (this.sourceNode.attr.selectedLabel) {
        setterNode.setRelativeData(path, item.label, attributes, null, reason);
    }

    // Bind a selectedItem (nodo completo)
    if (this.sourceNode.attr.selectedItem) {
        setterNode.setRelativeData(path, item, attributes, null, reason);
    }

    // Bind a selectedPath
    if (this.sourceNode.attr.selectedPath) {
        setterNode.setRelativeData(path, itemFullPath, item.attr, null, reason);
    }

    // Bind a selected_* (attributi specifici)
    var selattr = objectExtract(this.sourceNode.attr, 'selected_*', true);
    for (var sel in selattr) {
        setterNode.setRelativeData(path, item.attr[sel], attributes, null, reason);
    }

    // Pubblica evento
    this.sourceNode.publish('onSelected', {path:itemFullPath, item:item, node:node});
}
```

### Drag Data Format

```javascript
onDragStart: function(dragInfo) {
    var item = dragInfo.treenode.item;
    return {
        'text/plain': dragInfo.treenode.label,
        'text/xml': dragInfo.treenode.label,
        'nodeattr': item.attr,
        'treenode': {
            fullpath: item.getFullpath(),
            relpath: item.getFullpath(null, dragInfo.treenode.tree.model.store.rootData())
        }
    };
}
```

## Attributi Widget

### Base

| Attributo | Descrizione |
|-----------|-------------|
| `storepath` | Path ai dati Bag |
| `labelAttribute` | Attributo per label |
| `labelCb` | Callback per label custom |
| `identifier` | Attributo ID (default: '#id') |
| `hideValues` | Nascondi valori non-Bag |
| `nodeFilter` | Filtro nodi da mostrare |
| `hasChildrenCb` | Callback per children |

### Selection

| Attributo | Descrizione |
|-----------|-------------|
| `selectedPath` | Path binding per selezione |
| `selectedLabel` | Label binding per selezione |
| `selectedItem` | Item binding per selezione |
| `selected_*` | Attributi specifici binding |
| `selectedLabelClass` | Classe CSS nodo selezionato |

### Checkbox

| Attributo | Descrizione |
|-----------|-------------|
| `onChecked` | Callback/flag per checkbox mode |
| `checkedPaths` | Path per paths checked |
| `checked_*` | Binding per attributi checked |
| `checkChildren` | Propaga check ai figli (default: true) |
| `eagerCheck` | Check anche resolver non espansi |

### Search

| Attributo | Descrizione |
|-----------|-------------|
| `searchOn` | Configura searchbox |
| `searchCode` | ID searchbox |
| `searchMode` | 'async' o 'static' |
| `searchColumn` | Colonna specifica da cercare |

### Behavior

| Attributo | Descrizione |
|-----------|-------------|
| `autoCollapse` | Collassa fratelli su expand |
| `openOnClick` | Espande su click |
| `editable` | Abilita edit inline (modifiers) |
| `inspect` | Mostra attributi su hover |
| `popup` | Tree in menu popup |

## Rilevanza per genro-bag-js

⭐⭐ **MEDIA** - Mostra come GnrBag viene usato come data store per widget gerarchici.

### Concetti Utili

- GnrStoreBag come adapter Bag → dojo.store
- Navigazione path in struttura gerarchica
- Checkbox state propagation (tri-state)
- Search/filter con support async

### Da NON Portare

- Dipendenze dijit.Tree
- Dojo-specific store API
- DOM manipulation con dojo.query

### Pattern Interessanti

- **GnrStoreBag**: Adapter pattern per usare Bag come store
- **Checkbox tri-state**: Logica propagazione checked
- **Async filter**: Filtro con resolver lazy
- **Path-based selection**: Navigazione e selezione via path

## Note

1. **GnrStoreBag**: Wrapper che adatta GnrBag all'API dojo.store
2. **ForestStoreModel**: Permette tree senza root visibile
3. **checkBoxCalcStatus**: Calcola stato checkbox: true/false/-1 (mixed)
4. **searchMode**: 'async' per caricare lazy data durante search
5. **_itemNodeMap**: Cache per accesso veloce treeNode per ID

## File Correlati

- `gnrstores.js` - GnrStoreBag definition
- `gnrbag.js` - GnrBag/GnrBagNode
- `genro_widgets.js` - Altri widget handlers
- `genro_wdg.js` - Widget factory
