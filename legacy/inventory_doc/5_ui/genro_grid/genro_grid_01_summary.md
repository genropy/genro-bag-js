# genro_grid.js - Summary

**File**: `genro_grid.js`
**Linee**: 5051
**Dimensione**: 204 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Sistema completo di gestione grid per Genro. Implementa grid virtuali (con paginazione server-side), grid statiche, e includedview con editing inline. Include gestione drag&drop, sorting, filtering, checkbox columns, e integrazione con collection stores.

**Classi definite:**
- `gnr.widgets.DojoGrid` - Base class per tutte le grid
- `gnr.widgets.VirtualGrid` - Grid con paginazione server-side
- `gnr.widgets.VirtualStaticGrid` - Grid statica con dati locali
- `gnr.widgets.IncludedView` - Grid con editing inline
- `gnr.widgets.NewIncludedView` - Grid moderna con CollectionStore

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dojo.hitch`, `dojo.query`, `dojox.grid`
- **gnr.GnrBag**: Container dati per struttura e store
- **gnr.GridEditor**: Editor inline (da genro_wdg.js)
- **gnr.GridChangeManager**: Gestione formule e totali
- **gnr.GridFilterManager**: Filtri client-side
- **genro**: Global application object

## DojoGrid (Base Class) - Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `_domtag` | 'div' |
| `_dojotag` | Nome widget Dojo |
| `datamode` | 'attr' o 'bag' |
| `structBag` | Bag struttura colonne |
| `cellmap` | Mapping field → cell config |
| `gridEditor` | GridEditor se abilitato |
| `changeManager` | GridChangeManager |
| `filterManager` | GridFilterManager |
| `sortedBy` | Ordinamento corrente |
| `_identifier` | Campo identificatore righe |
| `autoSelect` | Selezione automatica prima riga |

## DojoGrid - Metodi Principali

### Lifecycle

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(application)` | Inizializza handler |
| `creating_common` | `(attributes, sourceNode)` | Estrae attributi comuni |
| `creating_structure` | `(attributes, sourceNode)` | Processa struttura colonne |
| `created_common` | `(widget, savedAttrs, sourceNode)` | Post-creazione comune |

### Structure

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `structFromDatasource` | `(sourceNode)` | Ottiene struttura da datasource |
| `gnr_cellFocus` | `(cell)` | Focus su cella |
| `gnr_cellDefocus` | `(cell)` | Defocus cella |
| `cellmap_build` | `(cellmap_result, structure)` | Costruisce cellmap |
| `structFromSource` | `(sourceNode, structBag)` | Converte Bag in struttura Dojo |
| `groupByFromStruct` | `(struct, grouppable)` | Estrae campi raggruppabili |

### Selection

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_getSelectedPkeys` | `(caption_field)` | Ottiene pkey selezionate |
| `mixin_getAllPkeys` | `(caption_field)` | Ottiene tutte le pkey |
| `mixin_selectByRowAttr` | `(attrName, attrValue, op, scrollTo)` | Seleziona per attributo |
| `mixin_selectByRowAttrDo` | `(...)` | Esecuzione selezione |
| `mixin_getSelectedNodes` | `()` | Ottiene nodi selezionati |
| `mixin_setSelectedIndex` | `(idx)` | Imposta indice selezione |

### Columns

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `mixin_deleteColumn` | `(col)` | Elimina colonna |
| `mixin_moveColumn` | `(col, toPos)` | Sposta colonna |
| `mixin_addColumn` | `(col, toPos, kw)` | Aggiunge colonna |
| `mixin_getColumnInfo` | `()` | Info colonne |

### Drag & Drop

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `onDragStart` | `(dragInfo)` | Inizio drag (row/cell/column) |
| `fillDropInfo` | `(dropInfo)` | Riempie info drop |
| `fillDragInfo` | `(dragInfo)` | Riempie info drag |
| `setTrashPosition` | `(dragInfo)` | Posiziona trash icon |

## VirtualGrid - Paginazione Server

Grid per grandi dataset con caricamento pagine on-demand.

| Metodo | Descrizione |
|--------|-------------|
| `mixin_loadBagPageFromServer` | Carica pagina da server |
| `mixin_clearBagCache` | Pulisce cache pagine |
| `mixin_setSortedBy` | Imposta ordinamento |
| `mixin_rowByIndex` | Riga per indice (con paging) |
| `mixin_rowIdentity` | Identità riga |

```javascript
// Paginazione
rowByIndex: function(inRowIndex, lazy) {
    var rowIdx = inRowIndex % this.rowsPerPage;
    var pageIdx = (inRowIndex - rowIdx) / this.rowsPerPage;
    if (this.currCachedPageIdx != pageIdx) {
        this.currCachedPage = this.loadBagPageFromServer(pageIdx);
    }
    return this.currCachedPage.getNodes()[rowIdx].attr;
}
```

## VirtualStaticGrid - Grid Statica

Grid con dati interamente in memoria.

### Filter System

| Metodo | Descrizione |
|--------|-------------|
| `mixin_applyFilter` | Applica filtro |
| `mixin_resetFilter` | Reset filtro |
| `mixin_compileFilter` | Compila callback filtro |
| `mixin_createFiltered` | Crea array indici filtrati |
| `mixin_isFiltered` | Verifica se filtrata |
| `mixin_filterToRebuild` | Marca filtro da ricostruire |

### Row Operations

| Metodo | Descrizione |
|--------|-------------|
| `mixin_rowByIndex` | Riga per indice |
| `mixin_rowFromBagNode` | Converte BagNode in row object |
| `mixin_rowCached` | Riga con caching |
| `mixin_dataNodeByIndex` | BagNode per indice |
| `mixin_storebag` | Ottiene Bag dati |

### Store Updates

| Metodo | Descrizione |
|--------|-------------|
| `mixin_setStorepath` | Handler trigger storepath |
| `mixin_newDataStore` | Nuovo store caricato |
| `mixin_refreshContent` | Refresh contenuto |
| `mixin_selectionKeeper` | Salva/ripristina selezione |

## IncludedView - Grid con Editing

Estende VirtualStaticGrid con capacità di editing inline.

### Row Editing

| Metodo | Descrizione |
|--------|-------------|
| `mixin_newBagRow` | Crea nuova riga |
| `mixin_addBagRow` | Aggiunge riga |
| `mixin_delBagRow` | Elimina riga |
| `mixin_editBagRow` | Inizia editing riga |
| `mixin_addRows` | Aggiunge righe (con prompt opzionale) |
| `mixin_deleteSelectedRows` | Elimina righe selezionate |

### CheckBox Columns

| Metodo | Descrizione |
|--------|-------------|
| `mixin_addCheckBoxColumn` | Aggiunge colonna checkbox |
| `mixin_onCheckedColumn` | Handler click checkbox |
| `mixin_getCheckedId` | Ottiene ID checked |
| `mixin_setCheckedId` | Imposta ID checked |
| `getCheckBoxKw` | Configura checkbox |

### Counter Column

| Metodo | Descrizione |
|--------|-------------|
| `mixin_updateCounterColumn` | Aggiorna colonna contatore |

### Change Manager Integration

| Metodo | Descrizione |
|--------|-------------|
| `mixin_setChangeManager` | Configura change manager |
| `mixin_setEditableColumns` | Configura colonne editabili |

## NewIncludedView - Grid con Store Moderno

Estende IncludedView con integrazione CollectionStore.

### Store Integration

| Metodo | Descrizione |
|--------|-------------|
| `mixin_collectionStore` | Ottiene collection store |
| `mixin_rowByIndex` | Riga via store |
| `mixin_absIndex` | Indice assoluto (considera filtri) |
| `mixin_storebag` | Bag via store |
| `mixin_storeRowCount` | Conteggio righe |

### Selection/Navigation

| Metodo | Descrizione |
|--------|-------------|
| `mixin_setSelectedId` | Seleziona per ID |
| `mixin_getSelectedRowidx` | Indici righe selezionate |
| `mixin_currentSelectionPars` | Parametri selezione corrente |
| `mixin_currentData` | Dati correnti (raw o formatted) |

### User Sets (Multi-selection tracking)

| Metodo | Descrizione |
|--------|-------------|
| `mixin_addNewSetColumn` | Aggiunge colonna set utente |
| `mixin_onChangeSetCol` | Handler cambio set |
| `mixin_setUserSets` | Imposta user sets |

### Export/Print

| Metodo | Descrizione |
|--------|-------------|
| `mixin_serverAction` | Azione server (export/print) |
| `mixin_getExportStruct` | Struttura per export |
| `mixin_getSqlVisibleColumns` | Colonne SQL visibili |

### Remote Edit

| Metodo | Descrizione |
|--------|-------------|
| `mixin_remoteCellEdit` | Edit remoto cella |

## Pattern Importanti

### Structure Definition

```javascript
// Struttura grid da Bag
// view_0.rows_0.cell_*
structBag = {
    'view_0': {
        'rows_0': {
            'cell_name': {tag:'cell', field:'name', name:'Nome', width:'100px'},
            'cell_qty': {tag:'cell', field:'qty', name:'Qty', dtype:'N', width:'80px'},
            'cell_date': {tag:'cell', field:'date', name:'Data', dtype:'D'}
        }
    }
}
```

### Cell Configuration

```javascript
// Proprietà cella
{
    tag: 'cell',
    field: 'fieldname',           // Campo dati
    name: 'Header',               // Intestazione
    width: '100px',               // Larghezza
    dtype: 'T/N/D/B/...',        // Data type
    edit: {...},                  // Config editing
    formula: 'qty * price',       // Formula calcolata
    totalize: '.total',           // Path per totale
    format_pattern: '#,###.00',   // Formato visualizzazione
    classes: 'myclass',           // CSS classes
    hidden: '^path.to.flag',      // Nascosta se true
    sortable: false,              // Disabilita sort
    _customGetter: function(){}   // Getter personalizzato
}
```

### Checkbox Column

```javascript
// Aggiunge checkbox column
widget.addCheckBoxColumn({
    field: '_checked',
    name: ' ',
    checkedId: '.selectedPkeys',
    checkedField: '_pkey',
    radioButton: false,
    action: 'console.log(changes)'
});
```

### Drag Row Data Format

```javascript
// Dati trasferiti durante drag
{
    'text/plain': 'col1\tcol2\n...',
    'text/xml': '<r_0><field1>v1</field1></r_0>',
    'text/html': '<table><tr><td>...</td></tr></table>',
    'gridrow': {row: idx, rowdata: {...}, rowset: [...], gridId: '...'},
    'dbrecords': {table: 'mytable', pkeys: [...], objtype: 'record'}
}
```

### Filter System

```javascript
// Filtro testuale
grid.applyFilter('search text', false, 'fieldname');

// Filtro numerico
grid.applyFilter('> 100', false, 'amount');
grid.applyFilter('= 50', false, 'qty');
grid.applyFilter('!= 0', false, 'value');

// Reset
grid.resetFilter();
```

### Selection Keeper

```javascript
// Salva selezione prima di operazioni
grid.selectionKeeper('save');

// Operazioni che alterano store...
store.reload();

// Ripristina selezione
grid.selectionKeeper('load');
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è UI-specific per grid Genro, non direttamente rilevante per genro-bag-js core.

### Concetti Utili

- Pattern di struttura colonne in Bag
- Conversione Bag → oggetti row per rendering
- Filter system con callback compilate
- Drag&drop con formati multipli

### Da NON Portare

- Dojo/Dijit grid integration
- Editing inline (UI-specific)
- CollectionStore integration
- Server actions (export/print)

### Pattern Interessanti

- **Structure as Bag**: Struttura dichiarativa in Bag
- **cellmap**: Cache efficiente per accesso celle
- **rowFromBagNode**: Pattern conversione BagNode → row object
- **Filter compilation**: Compilazione callback filtro

## Eventi Grid

```javascript
// Eventi pubblicati
nodeId + '_row_checked'    // Riga checkboxata
nodeId + '_data_loaded'    // Dati caricati
'onNewDatastore'          // Nuovo store
'onDeletedRows'           // Righe eliminate
'onAddedRows'             // Righe aggiunte
'setSortedBy'             // Ordinamento cambiato
```

## Note

1. **datamode**: 'attr' usa attributi nodo, 'bag' usa valore Bag
2. **_identifier**: Campo per identificare univocamente righe (default '_pkey')
3. **Virtual vs Static**: Virtual carica pagine on-demand, Static tiene tutto in memoria
4. **_filtered**: Array di indici che passano il filtro
5. **changeManager**: Gestisce formule, totali, e trigger su modifiche

## Gerarchia Classi

```
gnr.widgets.DojoGrid
    └── gnr.widgets.VirtualGrid
    └── gnr.widgets.VirtualStaticGrid
        └── gnr.widgets.IncludedView
            └── gnr.widgets.NewIncludedView
```

## File Correlati

- `genro_wdg.js` - GridEditor, GridChangeManager, GridFilterManager
- `gnrstores.js` - CollectionStore
- `genro_components.js` - Frame con grid
- `genro_frm.js` - Form con grid integrata
- `gnrbag.js` - GnrBag per struttura e dati
