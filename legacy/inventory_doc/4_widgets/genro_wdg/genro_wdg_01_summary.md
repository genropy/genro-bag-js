# genro_wdg.js - Summary

**File**: `genro_wdg.js`
**Linee**: 2322
**Dimensione**: 94 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler centrale per la creazione di widget. Contiene la classe `GnrWdgHandler` che gestisce il mapping tra tag XML/Bag e widget DOM/Dojo, più le classi per l'editing inline nelle grid.

**Classi definite:**
- `gnr.GnrWdgHandler` - Widget factory principale (`genro.wdg`)
- `gnr.RowEditor` - Editor per singola riga grid
- `gnr.GridEditor` - Gestore editing inline grid
- `gnr.GridFilterManager` - Filtri client-side per grid
- `gnr.GridChangeManager` - Gestione cambiamenti e formule grid

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dijit.Menu`
- **gnr.GnrBag**: Container dati
- **genro**: Global application object
- **gnrlang.js**: Utility functions

## GnrWdgHandler

Factory centrale per creazione widget.

### Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `namespace` | Mapping tag → [tipo, nome] |
| `widgetcatalog` | Mapping widget → dojo.require |
| `widgets` | Cache handler widget |
| `noConvertStyle` | Tag che non convertono stili |
| `tagParameters` | Parametri per tag specifici |

### Namespace (HTML Tags)

```javascript
// Tag HTML mappati automaticamente
['a', 'div', 'span', 'table', 'tr', 'td', 'form',
 'input', 'button', 'img', 'iframe', 'canvas', ...]

// Ogni tag → ['html', tag]
this.namespace['div'] = ['html', 'div'];
```

### Widget Catalog (Dojo Widgets)

```javascript
{
    'CheckBox': 'dijit.form.CheckBox',
    'TextBox': 'dijit.form.TextBox',
    'DateTextBox': 'dijit.form.DateTextBox',
    'NumberTextBox': 'dijit.form.NumberTextBox',
    'FilteringSelect': 'dijit.form.FilteringSelect',
    'ContentPane': 'dijit.layout.ContentPane',
    'BorderContainer': 'dijit.layout.BorderContainer',
    'TabContainer': 'dijit.layout.TabContainer',
    'Dialog': 'dijit.Dialog',
    'Editor': 'dijit.Editor,...',
    'Tree': 'dijit.Tree',
    // ...altri widget Dojo/Dojox
}
```

### Metodi Chiave

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `create` | `(tag, destination, attributes, ind, sourceNode)` | **Entry point** creazione widget |
| `getHandler` | `(tag)` | Ottiene handler per tag |
| `makeDomNode` | `(tag, destination, ind)` | Crea elemento DOM |
| `createHtmlElement` | `(domnode, attributes, kw, sourceNode)` | Crea elemento HTML puro |
| `createDojoWidget` | `(tag, domnode, attributes, kw, sourceNode)` | Crea widget Dojo |
| `getWidgetFactory` | `(tag, handler)` | Ottiene factory Dojo per tag |
| `linkSourceNode` | `(newobj, sourceNode, kw)` | Collega widget a sourceNode |
| `doMixin` | `(obj, handler, tag, sourceNode)` | Applica mixin/patch al widget |
| `wdgByDtype` | `(dtype)` | Widget appropriato per dtype |
| `widgetFromField` | `(fieldattr)` | Crea widget da attributi campo DB |
| `filterEvent` | `(e, modifiers, validclass)` | Filtra evento per modifiers |

### Flusso Creazione Widget

```
create(tag, destination, attributes, ind, sourceNode)
    │
    ├─► getHandler(tag)
    │       └─► widgets[lowertag] o namespace lookup
    │
    ├─► handler._beforeCreation(attributes, sourceNode)
    │
    ├─► makeDomNode(domtag, destination, ind)
    │
    ├─► Se HTML element:
    │       └─► createHtmlElement(domnode, attributes, kw, sourceNode)
    │
    └─► Se Dojo widget:
            ├─► createDojoWidget(tag, domnode, attributes, kw, sourceNode)
            │       ├─► getWidgetFactory(tag, handler)
            │       ├─► new wdgFactory(attributes, domnode)
            │       └─► doMixin(newobj, handler, tag, sourceNode)
            │
            └─► destination.addChild(newobj) se container
```

### Mixin/Patch System

Il sistema permette di estendere widget Dojo:

```javascript
// Handler widget può definire:
mixin_methodName     // Aggiunge metodo (warning se esiste)
patch_methodName     // Sostituisce metodo (salva in _replaced)
versionpatch_14_*    // Patch per versione Dojo specifica
nodemixin_*          // Metodo aggiunto a sourceNode
validatemixin_*      // Metodo per validazione
```

## RowEditor

Editor per singola riga in grid.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `gridEditor` | GridEditor parent |
| `grid` | Grid widget |
| `rowId` | Identificativo riga |
| `_pkey` | Primary key |
| `data` | Bag dati riga |
| `newrecord` | Flag nuova riga |
| `original_values` | Valori originali |

### Metodi

| Metodo | Descrizione |
|--------|-------------|
| `inititializeData` | Inizializza Bag dati |
| `checkNotNull` | Verifica campi required |
| `hasChanges` | Verifica modifiche |
| `getChangeset` | Ottiene modifiche |
| `getErrors` | Ottiene errori validazione |
| `startEditCell` | Inizia edit cella |
| `endEditCell` | Termina edit cella |
| `deleteRowEditor` | Elimina editor |
| `replaceData` | Sostituisce dati riga |

## GridEditor

Gestore editing inline per grid.

### Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `grid` | Grid widget |
| `viewId` | ID vista |
| `table` | Nome tabella DB |
| `editorPars` | Parametri editor |
| `autoSave` | Salvataggio automatico |
| `columns` | Colonne editabili |
| `deletedRows` | Righe eliminate |
| `status` | Stato editor |

### Metodi Chiave

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `enabled` | `()` | Verifica se editing abilitato |
| `startEdit` | `(row, col, dispatch)` | Inizia editing cella |
| `endEdit` | `(blurredWidget, delta, editingInfo)` | Termina editing |
| `addEditColumn` | `(colname, colattr)` | Aggiunge colonna editabile |
| `editableCell` | `(col, row, clicked)` | Verifica se cella editabile |
| `findNextEditableCell` | `(rc, delta)` | Trova prossima cella editabile |
| `saveChangedRows` | `()` | Salva modifiche su server |
| `getChangeset` | `(sendingStatus)` | Ottiene changeset |
| `deleteSelectedRows` | `(pkeys, protectPkeys)` | Elimina righe selezionate |
| `setCellValue` | `(rowIdx, cellname, value, ...)` | Imposta valore cella |
| `callRemoteController` | `(rowNode, field, oldvalue, batch)` | Chiama controller remoto |
| `batchAssign` | `()` | Assegnazione multipla |
| `updateStatus` | `(reset)` | Aggiorna stato editor |

### Navigazione con Tastiera

```javascript
// In editing mode:
TAB         → Cella successiva (SHIFT+TAB: precedente)
SHIFT+UP    → Riga sopra
SHIFT+DOWN  → Riga sotto
SHIFT+LEFT  → Cella a sinistra
SHIFT+RIGHT → Cella a destra
```

## GridFilterManager

Filtri client-side per grid.

### Metodi

| Metodo | Descrizione |
|--------|-------------|
| `filterset` | Ottiene set di filtri |
| `isInFilterSet` | Verifica se riga passa filtri |
| `activeFilters` | Lista filtri attivi |
| `hasActiveFilter` | Verifica se ci sono filtri |

## GridChangeManager

Gestione formule e totalizzatori.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `formulaColumns` | Colonne con formula |
| `totalizeColumns` | Colonne totalizzate |
| `triggeredColumns` | Dipendenze formule |
| `remoteControllerColumns` | Colonne con controller remoto |

### Metodi

| Metodo | Descrizione |
|--------|-------------|
| `addFormulaColumn` | Aggiunge colonna formula |
| `calculateFormula` | Calcola formula per riga |
| `addTotalizer` | Aggiunge totalizzatore |
| `updateTotalizer` | Aggiorna totale |
| `triggerUPD/INS/DEL` | Handler per trigger dati |

### Formula Syntax

```javascript
// Formula standard
formula: "price * quantity"

// Formula progressiva (running total)
formula: "+= amount"

// Formula percentuale
formula: "%= amount"

// Formula indice riga
formula: "#"
```

## Pattern Importanti

### Widget Creation Pattern

```javascript
// Nel build di GnrDomSourceNode:
var newobj = genro.wdg.create(tag, destination, attributes, ind, this);
if (newobj.domNode) {
    this.widget = newobj;
} else {
    this.domNode = newobj;
}
```

### Edit Column Definition

```javascript
// In grid structure:
{
    field: 'quantity',
    edit: {
        tag: 'NumberTextBox',
        validate_notnull: true,
        remoteRowController: true
    }
}
```

### Remote Row Controller

```javascript
// Chiamata controller lato server quando cambiano valori
callRemoteController(rowNode, 'quantity', oldValue);
// Server calcola nuovi valori dipendenti e li restituisce
```

## Rilevanza per genro-bag-js

⭐⭐⭐ **ALTA** - Questo modulo è il **Compiler** che trasforma Bag in DOM/Widget.

### Da Studiare per Architettura

- Pattern `create()` come entry point del Compiler
- Namespace/catalog per mapping tag → handler
- Mixin/patch system per estendere widget
- linkSourceNode per collegamento bidirezionale

### Da Portare (Concetti)

- **Widget Factory pattern**: `wdg.create(tag, dest, attrs)`
- **Handler registry**: namespace + widgetcatalog
- **Mixin system**: estensione widget
- **Validation integration**: collegamento con validazione

### Da NON Portare Direttamente

- Dojo-specific code (dijit, dojo.require)
- GridEditor (specifico per grid Genro)
- Row editing (specifico UI)

## Note

1. **Entry Point**: `genro.wdg.create()` è chiamato da `GnrDomSourceNode.build()`
2. **Handler Cache**: Gli handler vengono cached in `this.widgets`
3. **sourceNode Link**: Ogni widget/domNode mantiene riferimento a sourceNode
4. **Validation**: Widget di form integrano sistema validazione Genro

## File Correlati

- `gnrdomsource.js` - GnrDomSourceNode.build() chiama wdg.create()
- `genro_widgets.js` - Definizioni widget (`gnr.widgets.*`)
- `genro_components.js` - Componenti complessi
- `genro_grid.js` - Grid widget
- `genro_frm.js` - Form handler
