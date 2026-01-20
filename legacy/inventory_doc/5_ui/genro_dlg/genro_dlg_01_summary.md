# genro_dlg.js - Summary

**File**: `genro_dlg.js`
**Linee**: 1346
**Dimensione**: 58 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per la gestione di dialog, alert, prompt, floating messages, palettes e uploader in Genro. Fornisce un'interfaccia unificata per tutte le finestre modali e non-modali dell'applicazione.

**Classe definita:**
- `gnr.GnrDlgHandler` - Dialog handler (`genro.dlg`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.connect`, `dojo.fx`, `dijit.*`, `dojox.widget.Toaster`
- **gnr.GnrBag**: Container dati per parametri
- **gnr.GnrDomSourceNode**: Per costruzione dinamica UI
- **genro**: Global application object

## Proprietà Principali

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento a genro |
| `alert_count` | Contatore alert attivi |
| `_quickDialogDestroyTimeout` | Timeout distruzione dialog (500ms) |
| `messanger` | Toaster per messaggi standard |
| `prompt_counter` | Contatore prompt attivi |

## Metodi Principali

### Alert/Ask/Prompt

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `alert` | `(msg, title, buttons, resultPath, kw)` | Alert con bottoni personalizzabili |
| `ask` | `(title, msg, buttons, resultPathOrActions, kw)` | Conferma con callback per azione |
| `prompt` | `(title, kw, sourceNode)` | Input dialog con form dinamico |
| `request` | `(title, msg, buttons, resultPath, valuePath)` | Request con campo input |
| `askParameters` | `(cb, ask_params, parameters, sourceNode, argnames, argvalues)` | Chiede parametri prima di azione |

### Dialog

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `dialog` | `(msg, cb, buttons)` | Dialog generico base |
| `quickDialog` | `(title, kw, rootNode)` | Dialog veloce con center/bottom |
| `remoteDialog` | `(name, remote, remoteKw, dlgKw)` | Dialog con contenuto remoto |
| `lightboxDialog` | `(kwOrCb, onClosedCb)` | Lightbox overlay |
| `lightboxVideo` | `(url, kw)` | Video in lightbox |

### Floating Messages

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `message` | `(msg, position, level, duration)` | Toaster message |
| `serverMessage` | `(msgpath)` | Mostra messaggio da server |
| `floatingMessage` | `(sourceNode, kw)` | Messaggio floating temporaneo |
| `createStandardMsg` | `(domnode)` | Crea toaster standard |

### IFrame Dialogs/Palettes

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `iframeDialog` | `(iframeId, kw)` | Dialog con iframe interno |
| `thIframeDialog` | `(kw, openKw)` | Dialog iframe per TableHandler |
| `iframePalette` | `(kw)` | Palette con iframe |
| `thIframePalette` | `(kw, openKw)` | Palette iframe per TableHandler |

### Palette/Floating Panes

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `floating` | `(kw)` | Floating pane generico |
| `quickPalette` | `(paletteCode, kw, content)` | Palette veloce |
| `zoomPalette` | `(kw, openKw)` | Palette zoom da griglia |
| `paletteMap` | `(kw)` | Palette con mappa |
| `floatingEditor` | `(sourceNode, kw)` | Editor in floating pane |
| `dialogEditor` | `(sourceNode, kw)` | Editor in dialog |

### Upload Dialogs

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `uploaderDialog` | `(title, method, kw)` | Dialog upload singolo file |
| `modalUploaderDialog` | `(title, kw, sourceNode)` | Dialog upload modale con preview |
| `multiUploaderDialog` | `(title, kw, sourceNode)` | Dialog upload multiplo |
| `upload` | `(title, method, resultPath, remotekw, ...)` | Upload deprecato |

### Zoom/Navigation

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `zoomFromCell` | `(evt)` | Zoom da cella griglia |
| `zoomPage` | `(kw)` | Apre pagina zoom |
| `makeZoomElement` | `(kw)` | Crea elemento zoom (palette/page/window) |
| `zoomPaletteFromSourceNode` | `(sourceNode, evt)` | Zoom da sourceNode |

### Utility

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `batchMonitor` | `(thermopath)` | Monitor progresso batch |
| `listChoice` | `(title, msg, buttons, resultPath, valuePath, storePath)` | Dialog selezione lista |
| `quickTooltipPane` | `(kw, contentCb, contentCbKw)` | Tooltip pane veloce |
| `lazyTip` | `(domNode, rpcmethod, ...)` | Tooltip caricato lazy |
| `connectTooltipDialog` | `(wdg, btnId)` | Connette tooltip dialog |
| `_prepareThIframeUrl` | `(kw)` | Prepara URL per iframe TH |

## Pattern Importanti

### Alert Pattern

```javascript
alert: function(msg, title, buttons, resultPath, kw) {
    var alertCode = '_dlg_alert_'+this.alert_count;
    genro.src.getNode()._('div', alertCode);
    var node = genro.src.getNode(alertCode).clearValue().freeze();

    var dlg = node._('dialog', {
        nodeId: alertCode,
        title: title,
        _class: 'dlg_alert',
        connect_show: function(){ that.alert_count+=1; },
        connect_hide: function(){ that.alert_count-=1; }
    })._('div', {_class:'dlg_ask', action:function(){...}});

    dlg._('div', {innerHTML:msg, _class:'dlg_ask_msg'});
    for (var btn in buttons) {
        dlg._('button', {label:buttons[btn], actCode:btn});
    }
    node.unfreeze();
    genro.wdgById(alertCode).show();
}
```

### Quick Dialog Pattern

```javascript
quickDialog: function(title, kw, rootNode) {
    var dlg = node._('dialog', {title:title, ...kw});

    // Layout con center e bottom
    if(kw.windowRatio || kw.parentRatio || kw.fullScreen){
        let bc = dlg._('BorderContainer');
        dlg.bottom = bc._('contentPane', {region:'bottom'});
        dlg.center = bc._('contentPane', {region:'center'});
    } else {
        let box = dlg._('div', kwdimension);
        dlg.center = box._('div', {_class:'pbl_dialog_center'});
        dlg.bottom = box._('div', {_class:'dialog_bottom'});
    }

    // Helper methods
    dlg.close_action = function() { ... };
    dlg.show_action = function(onShowCb) { ... };

    return dlg;
}
```

### Floating Message Pattern

```javascript
floatingMessage: function(sourceNode, kw) {
    var message = kw.message;
    var msgType = kw.messageType || 'message';
    var duration_in = kw.duration_in || 2;
    var duration_out = kw.duration_out || 2;

    // Crea box floating con classe invisible
    var messageBox = sourceNode._('div','_floatingmess',{
        _class:'invisible fm_box fm_'+msgType,
        transition:'opacity '+duration_in+'s'
    });

    // Animazione fade in → wait → fade out → delete
    setTimeout(function(){
        genro.dom.removeClass(messageBox,'invisible');
        setTimeout(function(){
            if(duration_out>0){
                genro.dom.addClass(messageBox,'invisible');
                setTimeout(deleteCb, duration_out*500);
            }
        }, duration_in*1000);
    }, 1);
}
```

### IFrame Palette Pattern

```javascript
thIframePalette: function(kw, openKw) {
    var paletteCode = 'th_'+table.replace('.','_');
    var paletteNode = genro.nodeById(paletteCode+'_floating');

    if(paletteNode){
        // Palette esistente: mostra
        paletteNode.widget.show();
        paletteNode.widget.bringToTop();
    } else {
        // Crea nuova palette con iframe
        var zoomUrl = this._prepareThIframeUrl(kw);
        var palette = node._('palettePane', paletteCode, paletteAttr);
        var iframeNode = palette._('iframe', {
            src: zoomUrl,
            onStarted: function(){
                // Subscribe a eventi form
                this._genro._rootForm.subscribe('onDismissed',...);
                this._genro._rootForm.subscribe('onChangedTitle',...);
            }
        });
    }

    // Passa parametri via postMessage
    if(objectNotEmpty(openKw)){
        paletteNode._iframeNode.domNode.gnr.postMessage(paletteNode._iframeNode, openKw);
    }
}
```

### Prompt con Form Dinamico

```javascript
prompt: function(title, kw, sourceNode) {
    var dlg = genro.dlg.quickDialog(title, dlg_kw, sourceNode);

    // Widget può essere:
    // - string: singolo widget
    // - array: multipli campi form
    // - function: callback che costruisce contenuto
    // - 'multiValueEditor': editor valori multipli

    if(typeof(wdg)=='string'){
        fb = genro.dev.formbuilder(box, cols, {onEnter:onEnter});
        fb.addField(wdg, {value:'^.promptvalue', ...});
    } else if(wdg instanceof Array) {
        wdg.forEach(function(n){
            var w = objectPop(n,'wdg','textbox');
            fb.addField(w, n);
        });
    }

    // Bottoni confirm/cancel con validazione
    var bar = dlg.bottom._('slotBar', {slots:'*,cancel,confirm'});
    bar._('button','cancel',{label:'Cancel'});
    bar._('button','confirm',{label:'Confirm', disabled:'^.promptvalue?=...'});
}
```

### Upload Modale con Preview

```javascript
modalUploaderDialog: function(title, kw, sourceNode) {
    var dlg = genro.dlg.quickDialog(title, dlg_kw);
    var sc = dlg.center._('stackContainer');

    // Pagina 1: Uploader
    this._modalUploader_uploader(sc, kw, dlg);
    // - Drop area
    // - onResult → switch to preview

    // Pagina 2: Preview
    this._modalUploader_preview(sc, dlg, sourceNode, kw);
    // - iframe preview
    // - Conferma → salva su destinazione

    dlg.show_action();
}
```

## Tipi di Dialog

### Standard Dialogs
- `alert`: Messaggio con OK
- `ask`: Conferma con Confirm/Cancel
- `prompt`: Input con validazione
- `request`: Input con risultato in path
- `listChoice`: Selezione da lista

### Specialized Dialogs
- `iframeDialog`: Contenuto in iframe
- `thIframeDialog`: Form TableHandler in iframe
- `lightboxDialog`: Overlay scuro con contenuto centrato
- `remoteDialog`: Contenuto caricato via RPC

### Floating Elements
- `floatingMessage`: Notifica temporanea
- `quickPalette`: Palette posizionabile
- `floatingPane`: Pane mobile
- `batchMonitor`: Progress monitor

### Upload Dialogs
- `uploaderDialog`: Upload singolo
- `multiUploaderDialog`: Upload multiplo con griglia
- `modalUploaderDialog`: Upload con preview

## Rilevanza per genro-bag-js

⭐ **BASSA** - Questo modulo è UI-specific per Genro, non direttamente rilevante per genro-bag-js core.

### Concetti Utili

- Pattern costruzione dinamica UI con sourceNode
- Gestione counter per istanze multiple
- freeze/unfreeze per build atomico
- postMessage per comunicazione iframe

### Da NON Portare

- Dipendenze Dojo (dialog, toaster, floatingPane)
- Gestione upload (specifico browser)
- TableHandler integration
- Server RPC calls

### Pattern Interessanti

- **Dialog Factory**: quickDialog come factory per dialog standard
- **freeze/unfreeze**: Build atomico del DOM
- **postMessage**: Comunicazione cross-iframe
- **Counter management**: Tracking istanze attive

## Note

1. **alert_count**: Tiene traccia dei dialog aperti per gestire sovrapposizioni
2. **quickDialog**: Factory che crea dialog con layout standard (center + bottom)
3. **thIframePalette**: Pattern per form in palette floating
4. **freeze/unfreeze**: Impedisce rendering parziale durante costruzione
5. **postMessage**: Usato per passare dati a iframe child

## File Correlati

- `genro_wdg.js` - Widget handler
- `genro_widgets.js` - Widget definitions (dialog, floatingPane)
- `genro_src.js` - Source handler per costruzione dinamica
- `gnrdomsource.js` - GnrDomSourceNode
- `genro_frm.js` - Form handler (per dialog form)
