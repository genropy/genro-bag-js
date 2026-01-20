# genro_components.js - Summary

**File**: `genro_components.js`
**Linee**: 7966
**Dimensione**: 349 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Definisce componenti widget complessi per l'interfaccia Genro. Include widget compositi (frame, form, grid), store per dati, palette colori, menu, toolbar con slot system.

**Namespace principale:**
- `gnr.widgets.gnrwdg` - Base class per tutti i widget Genro
- `gnr.stores.*` - Store classes per gestione dati

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dojo.subscribe`, `dojo.publish`, `dojo.query`, `dijit`
- **gnr.GnrBag**: Container dati
- **gnrlang.js**: Utility functions
- **genro**: Global application object

## Classe Base: gnr.widgets.gnrwdg

Classe base per tutti i widget Genro personalizzati.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `skipOnRecursiveCreate` | Tag da saltare in creazione ricorsiva |
| `contentKwargs` | Kwargs passati al contenuto |
| `gnrwdg_rootName` | Nome del nodo root del widget |
| `gnr_bld_autoIncludeLabel` | Auto-include label wrapper |

### Metodi Principali

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `createContent` | `(sourceNode, kw, children)` | Entry point creazione contenuto |
| `contentFromDatasource` | `(sourceNode)` | Contenuto da datasource |
| `mixin_publish` | `(sourceNode, kw)` | Mixin per pubblicazione eventi |
| `creatingContent` | `(sourceNode, kw, children)` | Hook creazione (override) |
| `created` | `(widget, savedAttrs, sourceNode)` | Hook post-creazione |
| `onValueChanged` | `(sourceNode, value)` | Handler cambio valore |

## Widget Definiti

### UI Base

| Widget | Descrizione |
|--------|-------------|
| `TooltipPane` | Tooltip con contenuto Bag |
| `MenuDiv` | Menu dropdown |
| `ColorTextBox` | Input colore con palette |
| `Palette` | Palette colori base |
| `PaletteGroup` | Gruppo di palette |
| `PalettePane` | Container per palette |

### Frame System

| Widget | Descrizione |
|--------|-------------|
| `FramePane` | Container con top/bottom/left/right/center |
| `BorderContainer_` | Wrapper BorderContainer Dojo |
| `TabContainer_` | Wrapper TabContainer con API estesa |
| `StackContainer_` | Wrapper StackContainer |
| `ContentPane_` | Wrapper ContentPane |

### Form System

| Widget | Descrizione |
|--------|-------------|
| `FrameForm` | Form con frame layout |
| `FormStore` | Store per form data |

### Grid System

| Widget | Descrizione |
|--------|-------------|
| `QuickGrid` | Grid semplice da struttura |
| `QuickThGrid` | Grid semplice (th version) |

### Editor e Input

| Widget | Descrizione |
|--------|-------------|
| `BagEditor` | Editor per Bag structures |
| `PagedHtml` | HTML paginato |
| `DropDownButton_` | Button con dropdown |

### SlotBar System

Sistema di toolbar componibili con "slot" posizionabili.

| Widget | Descrizione |
|--------|-------------|
| `SlotBar` | Toolbar con slot configurabili |
| `SlotButton` | Button per SlotBar |

#### Slot Types

```javascript
// Slot predefiniti in SlotBar
'*'          // Spacer flessibile
'|'          // Separatore verticale
'-'          // Separatore orizzontale
'5'          // Spacer 5px
'searchOn'   // Campo ricerca
'export'     // Export button
'print'      // Print button
'count'      // Contatore righe
'vtitle'     // Titolo verticale
```

## Store System (gnr.stores.*)

Sistema di store per gestione dati in grid e form.

### Gerarchia Store

```
gnr.stores.BagRowsBase
    └── gnr.stores.BagRows
        └── gnr.stores.AttributesBagRows
            ├── gnr.stores.RpcBase
            │   └── gnr.stores.FileSystem
            └── gnr.stores.Selection
                └── gnr.stores.VirtualSelection
```

### gnr.stores.BagRowsBase

Classe base per store basati su Bag.

| Metodo | Descrizione |
|--------|-------------|
| `getData` | Ottiene Bag dati |
| `len` | Numero righe |
| `rowByIndex` | Riga per indice |
| `rowFromItem` | Converte BagNode in row object |
| `addNewRows` | Aggiunge nuove righe |
| `deleteRows` | Elimina righe |
| `setFilter` | Imposta filtro |
| `resetFilter` | Reset filtro |
| `sort` | Ordina dati |
| `sum` | Somma colonna |

### gnr.stores.Selection

Store per selezioni database con live update.

| Proprietà | Descrizione |
|-----------|-------------|
| `liveUpdate` | Modalità aggiornamento ('LOCAL', 'PAGE', 'NO') |
| `pendingChanges` | Modifiche in attesa |

| Metodo | Descrizione |
|--------|-------------|
| `loadData` | Carica dati da server |
| `onExternalChange` | Gestisce modifiche esterne |
| `deleteRows` | Elimina righe (RPC) |
| `archiveRows` | Archivia righe |
| `duplicateRows` | Duplica righe |

### gnr.stores.VirtualSelection

Store per selezioni virtuali (paginazione server-side).

| Proprietà | Descrizione |
|-----------|-------------|
| `chunkSize` | Dimensione pagina |
| `pendingPages` | Pagine in caricamento |
| `selectionName` | Nome selezione server |

| Metodo | Descrizione |
|--------|-------------|
| `getDataChunk` | Ottiene chunk dati |
| `loadBagPageFromServer` | Carica pagina da server |
| `itemByIdx` | Item per indice (con prefetch) |

## Pattern Importanti

### Widget Creation Pattern

```javascript
dojo.declare("gnr.widgets.MyWidget", gnr.widgets.gnrwdg, {
    createContent: function(sourceNode, kw, children) {
        // Prepara kwargs
        this._prepareKwargs(kw);

        // Crea struttura
        return sourceNode._('div', 'root')
            ._('span', 'label', {innerHTML: kw.label});
    },

    created: function(widget, savedAttrs, sourceNode) {
        // Post-processing
    }
});
```

### SlotBar Pattern

```javascript
// Definizione toolbar
sourceNode._('SlotBar', {
    slots: '*,searchOn,|,export,print',
    searchOn: true,
    export: {action: 'EXPORT'}
});

// Slot personalizzato
gnr.widgets.SlotBar.prototype['slot_mySlot'] = function(pane, kw) {
    return pane._('button', {label: 'My Button'});
};
```

### Store Pattern

```javascript
// Creazione store
dojo.declare("gnr.stores.MyStore", gnr.stores.BagRowsBase, {
    loadData: function() {
        // Caricamento dati
    },

    rowFromItem: function(item) {
        // Conversione BagNode → row object
        return {...item.attr};
    }
});
```

## Frame Layout

Il sistema FramePane divide lo spazio in regioni:

```
┌─────────────────────────────┐
│           top               │
├──────┬─────────────┬────────┤
│      │             │        │
│ left │   center    │ right  │
│      │             │        │
├──────┴─────────────┴────────┤
│          bottom             │
└─────────────────────────────┘
```

Configurazione:
```javascript
sourceNode._('FramePane', {
    frameCode: 'myFrame',
    top: {slots: 'title,*,searchOn'},
    bottom: {slots: 'count,*,export'},
    center: {widget: 'grid'}
});
```

## Live Update System

Il sistema Selection supporta aggiornamenti live:

```javascript
// Modalità liveUpdate
'LOCAL'  // Aggiorna da stessa macchina
'PAGE'   // Aggiorna da stessa pagina
'NO'     // Nessun aggiornamento automatico

// Gestione cambiamenti esterni
onExternalChange(changelist) {
    // Verifica modifiche nel database
    // Aggiorna righe locali
    // Notifica grid
}
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è specifico per UI Genro, non per la libreria Bag core.

### Concetti Utili

- Pattern di creazione widget
- Sistema store per dati tabellari
- SlotBar per toolbar componibili
- Live update tramite subscription

### Da NON Portare

- Widget UI (specifici Dojo/Dijit)
- Store database (specifici Genro server)
- Frame layout (specifico Genro UI)
- Integrazione con `genro` global

### Concept Interessanti

- **Store abstraction**: Pattern per wrappare Bag come data source
- **SlotBar**: Sistema modulare per toolbar
- **Live update**: Pattern per sincronizzazione dati

## Note

1. **Widget Registration**: I widget vengono registrati tramite `gnr.widgets.MyWidget`
2. **sourceNode**: Tutti i widget ricevono il nodo sorgente per costruire DOM
3. **kw pattern**: I kwargs vengono estratti e processati prima della creazione
4. **Publish/Subscribe**: Comunicazione tra componenti via topic

## File Correlati

- `genro_wdg.js` - Widget handler (gnr.wdg)
- `genro_widgets.js` - Widget definitions base
- `gnrbag.js` - GnrBag per dati
- `gnrdomsource.js` - GnrDomSource per build
- `genro_grid.js` - Grid implementation
- `genro_frm.js` - Form implementation
