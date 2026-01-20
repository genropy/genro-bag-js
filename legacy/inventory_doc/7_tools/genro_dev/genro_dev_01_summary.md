# genro_dev.js - Summary

**File**: `genro_dev.js`
**Linee**: 1564
**Dimensione**: 68 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per strumenti di sviluppo, debugging, ispezione e utility per developers Genro. Include inspector per data/source, debug SQL/RPC, screenshot, gestione errori, keyboard shortcuts, user objects save/load, e helpdesk.

**Classe definita:**
- `gnr.GnrDevHandler` - Developer tools handler (`genro.dev`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dojo.style`, `dijit.*`
- **gnr.GnrBag**: Container dati
- **gnr.GnrDomSource**: Per costruzione dinamica UI
- **genro**: Global application object

## Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento a genro |
| `_debuggerWindow` | Window del debugger GnrIDE |

## Metodi Principali

### Inspection/Debug

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `inspectConnect` | `(pane)` | Connette inspect mode (Alt+Shift) |
| `openBagNodeEditorPalette` | `(nodePath, kw)` | Palette per edit nodo Bag |
| `openBagInspector` | `(path, kw)` | Ispeziona Bag in tree |
| `openBagEditorPalette` | `(path, kw)` | Editor palette per Bag |
| `openInspector` | `()` | Apre Developer Tools completi |
| `showInspector` | `()` | Mostra inspector se non già aperto |

### Error Handling

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `handleRpcHttpError` | `(response, ioArgs)` | Gestisce errori HTTP RPC |
| `handleRpcError` | `(error, envNode)` | Gestisce errori RPC logici |
| `addError` | `(error, error_type, show)` | Aggiunge errore a log |
| `serverWriteError` | `(description, type, kw)` | Scrive errore su server |
| `errorPalette` | `(parent)` | Palette visualizzazione errori |

### Debugger Integration

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `startDebug` | `(callcounter)` | Avvia debugger |
| `openGnrIde` | `()` | Apre finestra GnrIDE |
| `onDebugstep` | `(data)` | Handler step debugger |
| `updateDebuggerStepBox` | `(callcounter, data)` | Aggiorna UI step |
| `continueDebugInIde` | `(pdb_id, debugger_page_id)` | Continua esecuzione |
| `openDebugInIde` | `(pdb_id, debugger_page_id)` | Apre debug in IDE |
| `handleDebugPath` | `(dataNode)` | Imposta breakpoint su path |

### Form Builder

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `formbuilder` | `(node, col, tblattr)` | Crea formbuilder tabellare |

### Database Explorer

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `relationExplorer` | `(table, title, rect)` | Esplora relazioni tabella |
| `tableUserConfiguration` | `(table)` | Apre configurazione tabella |
| `fieldsTree` | `(pane, table, kw)` | Tree campi tabella |

### Palette/Tools

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `sqlDebugPalette` | `(parent)` | Palette debug SQL |
| `cssDebugPalette` | `(parent)` | Palette debug CSS |
| `devUtilsPalette` | `(parent)` | Palette utility dev |

### User Objects

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `userObjectSave` | `(sourceNode, kw, onSaved)` | Salva user object |
| `userObjectLoad` | `(sourceNode, kw)` | Carica user object |
| `userObjectDialog` | `(title, datapath, saveCb, preview)` | Dialog save user object |
| `userObjectMenuData` | `(kw, extraRows)` | Menu user objects |

### Shortcuts

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `shortcut` | `(shortcut, callback, opt, sourceNode)` | Registra keyboard shortcut |

### Query Parameters

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `translateQueryPars` | `(currwhere)` | Estrae parametri da query |
| `dynamicQueryParsFb` | `(sourceNode, wherebag, parslist)` | Form parametri query |

### Screenshot/Pictures

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `takePicture` | `(sendPars, onResult)` | Cattura screenshot con selezione |

### Helpdesk

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `openHelpDesk` | `()` | Apre palette helpdesk |
| `openHelpDesk_index/documentation/help/bug_report/new_ticket` | `(pane, bottom, pages)` | Pagine helpdesk |

### Utilities

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `debugMessage` | `(msg, level, duration)` | Pubblica messaggio debug |
| `deprecation` | `(oldval, newval)` | Warning deprecazione |
| `dictToHtml` | `(obj, tblclass)` | Converte dict in HTML table |
| `printUrl` | `(url)` | Stampa URL (deprecated) |
| `exportUrl` | `(url)` | Export URL (deprecated) |
| `convertJsStructToPython` | `(structBag)` | Converte struct grid in Python |

## Pattern Importanti

### Inspect Mode

```javascript
inspectConnect: function(pane) {
    dojo.connect(pane, 'onmousemove', function(e) {
        if (e.altKey && e.shiftKey) {
            var sourceNode = genro.src.enclosingSourceNode(e.target);
            genro.src.highlightNode(sourceNode);
            genro.publish('srcInspector_editnode', sourceNode);
        } else {
            genro.src.highlightNode();
        }
    });

    dojo.connect(pane, 'onclick', function(e) {
        if (e.altKey && e.shiftKey) {
            var sourceNode = genro.src.enclosingSourceNode(e.target);
            genro.dev.openBagNodeEditorPalette(sourceNode.getFullpath(), {...});
            window._sourceNode_ = sourceNode;  // Debug access
        }
    });
}
```

### FormBuilder

```javascript
formbuilder: function(node, col, tblattr) {
    var tbl = node._('table', tblattr || {})._('tbody');
    tbl.col_max = col || 1;
    tbl.col_count = tbl.col_max + 1;

    tbl.addField = function(tag, kw) {
        if (this.col_count > this.col_max) {
            this.curr_tr = this._('tr');
            this.col_count = 1;
        }
        var lbl = objectPop(kw, 'lbl');
        var tr = this.curr_tr;
        tr._('td', {innerHTML: lbl, _class: 'gnrfieldlabel'});
        var res = tr._('td')._(tag, kw);
        this.col_count++;
        return res;
    };
    return tbl;
}

// Uso:
var fb = genro.dev.formbuilder(box, 2);
fb.addField('textbox', {lbl: 'Nome', value: '^.name'});
fb.addField('textbox', {lbl: 'Email', value: '^.email'});
```

### Keyboard Shortcuts

```javascript
shortcut: function(shortcut, callback, opt, sourceNode) {
    // Supporta format custom da preference
    if (shortcut[0] == '@') {
        shortcut = genro.getData('gnr.user_preference.sys.shortcuts.' + shortcut.slice(1));
    }

    var special_keys = {
        'esc': 27, 'tab': 9, 'enter': 13, 'backspace': 8,
        'f1': 112, 'f2': 113, ... 'f12': 123
    };

    var func = function(e) {
        var keys = shortcut.toLowerCase().split("+");
        var kp = 0;  // key press count

        for (var k of keys) {
            if (k == 'ctrl' && e.ctrlKey) kp++;
            else if (k == 'cmd' && e.metaKey) kp++;
            else if (k == 'shift' && e.shiftKey) kp++;
            else if (k == 'alt' && e.altKey) kp++;
            else if (special_keys[k] == code) kp++;
            else if (character == k) kp++;
        }

        if (kp == keys.length) {
            callback(e);
            if (!opt.propagate) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    };

    ele.addEventListener(opt.type, func, false);
}
```

### User Object Save/Load

```javascript
userObjectSave: function(sourceNode, kw, onSaved) {
    var saveCb = function(dlg, evt, counter, modifiers) {
        var data = new gnr.GnrBag();
        if (kw.dataIndex) {
            for (var key in kw.dataIndex) {
                data.setItem(key, sourceNode.getRelativeData(kw.dataIndex[key]));
            }
            data.setItem('__index__', new gnr.GnrBag(kw.dataIndex));
        }

        var metadata = genro.getData(datapath);
        return genro.serverCall('_table.adm.userobject.saveUserObject', {
            objtype: kw.objtype,
            table: kw.table,
            data: data,
            metadata: metadata
        }, function(result) {
            dlg.close_action();
            onSaved && onSaved({result: result});
        });
    };

    if (userObjectIsLoaded && !saveAs) {
        return saveCb();
    }
    this.userObjectDialog(title, datapath, saveCb, preview);
}
```

### Developer Tools Palette

```javascript
openInspector: function() {
    var pg = node._('paletteGroup', {
        groupCode: 'devTools',
        title: 'Developer tools [' + genro._('gnr.pagename') + ']'
    });

    // Data tree
    pg._('paletteTree', {
        paletteCode: 'cliDatastore',
        title: 'Data',
        storepath: '*D',
        searchOn: true,
        tree_inspect: 'shift',
        editable: true
    });

    // Source tree
    pg._('paletteTree', {
        paletteCode: 'cliSourceStore',
        title: 'Source',
        storepath: '*S',
        searchOn: true,
        editable: true
    });

    // DB Model tree
    pg._('paletteTree', {
        paletteCode: 'dbmodel',
        title: 'Model'
    });

    this.sqlDebugPalette(pg);
    this.devUtilsPalette(pg);
}
```

### Screenshot with Selection

```javascript
takePicture: function(sendPars, onResult) {
    var overlay = document.createElement('div');
    dojo.style(overlay, {
        position: 'fixed', top: '0', bottom: '0', left: '0', right: '0',
        opacity: '.3', background: 'white', zIndex: 1000, cursor: 'crosshair'
    });

    var sel = document.createElement('div');
    // Selection rectangle

    dojo.connect(overlay, 'mousedown', function(event) {
        isSelection = true;
        x1 = event.pageX;
        y1 = event.pageY;
        sel.style.display = 'block';
    });

    dojo.connect(overlay, 'mouseup', function(event) {
        isSelection = false;
        sel.style.display = 'none';
        dojo.body().removeChild(overlay);

        genro.dom.htmlToCanvas(dojo.body(), {
            sendPars: sendPars,
            crop: {x: x1, y: y1, deltaX: xDif, deltaY: yDif}
        });
    });
}
```

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è specifico per development tools, non rilevante per genro-bag-js core.

### Concetti Utili

- FormBuilder pattern per form dinamici
- Keyboard shortcuts con modifiers
- Inspect mode con Alt+Shift
- User object persistence pattern

### Da NON Portare

- Debugger integration (specifico Python)
- SQL debug tools
- Helpdesk UI
- Screenshot utility (browser-specific)

### Pattern Interessanti

- **FormBuilder**: Pattern tabellare per form veloci
- **Inspect Mode**: Alt+Shift per inspect elementi
- **User Objects**: Pattern per salvare/caricare configurazioni utente
- **Shortcuts**: Sistema flessibile per keyboard shortcuts

## Note

1. **Alt+Shift**: Combinazione per attivare inspect mode
2. **`*D`/`*S`**: Shortcut paths per Data store e Source store
3. **userObject**: Sistema per salvare configurazioni utente nel DB
4. **formbuilder**: Utility per creare form tabellari velocemente
5. **GnrIDE**: Debugger esterno per debugging Python

## File Correlati

- `genro.js` - Application core
- `genro_src.js` - Source handler
- `genro_dlg.js` - Dialog utilities
- `genro_dom.js` - DOM utilities (htmlToCanvas)
- `genro_rpc.js` - RPC handler
