# genro_uo.js - Summary

**File**: `genro_uo.js`
**Linee**: ~190
**Dimensione**: 8 KB
**Ultima modifica**: Legacy code

## Scopo

Gestione User Objects - oggetti persistenti salvati per utente. Permette di salvare, caricare e gestire configurazioni, preferenze e dati personalizzati per ogni utente.

## Dipendenze

- `genro` (oggetto globale applicazione)
- `gnr.GnrBag` (per struttura dati)
- Server RPC (`_table.adm.userobject.*`)

## Classe Principale

### `UserObjectHandler`

```javascript
class UserObjectHandler {
    constructor(sourceNode, objtype, table, dataIndex, onSaved, onLoaded) {
        this.sourceNode = sourceNode;
        this.objtype = objtype;
        this.table = table;
        this.dataIndex = dataIndex;
    }

    load() {}
    save() {...}
    dialog() {...}
}
```

## Attributi

| Attributo | Descrizione |
|-----------|-------------|
| `sourceNode` | Nodo sorgente DOM |
| `objtype` | Tipo oggetto utente |
| `table` | Tabella associata |
| `dataIndex` | Indice dati per mapping |

## Metodo `save()`

Salva un oggetto utente con dialog opzionale:

```javascript
save() {
    var datapath = sourceNode.absDatapath(kw.metadataPath);
    var saveAs = objectPop(kw, 'saveAs');
    var currentMetadata = genro.getData(datapath);
    var userObjectIsLoaded = currentMetadata && currentMetadata.getItem('code');
    var preview = objectPop(kw, 'preview');

    var saveCb = function(dlg, evt, counter, modifiers) {
        var data = new gnr.GnrBag();

        if(kw.dataIndex) {
            // Raccoglie dati da dataIndex
            for(var key in kw.dataIndex) {
                data.setItem(key, sourceNode.getRelativeData(kw.dataIndex[key]));
            }
            data.setItem('__index__', new gnr.GnrBag(kw.dataIndex));
        } else if(kw.dataSetter) {
            // Usa dataSetter custom
            funcApply(kw.dataSetter, {data: data}, sourceNode);
        }

        var metadata = new gnr.GnrBag(kw.defaultMetadata);
        metadata.update(genro.getData(datapath));

        if(!metadata.getItem('code')) {
            genro.publish('floating_message', {
                message: _T('Missing code'),
                messageType: 'error'
            });
            return;
        }

        // Chiamata server per salvare
        return genro.serverCall(
            '_table.adm.userobject.saveUserObject',
            {
                'objtype': kw.objtype,
                'table': kw.table,
                flags: kw.flags,
                'data': data,
                metadata: metadata
            },
            function(result) {
                if(dlg) {
                    dlg.close_action();
                } else {
                    var objname = result.attr.description || result.attr.code;
                    genro.publish('floating_message', {
                        message: _T('Saved object ' + objname)
                    });
                }

                if(kw.loadPath) {
                    sourceNode.setRelativeData(kw.loadPath, result.attr.code);
                }

                if(onSaved) {
                    funcApply(onSaved, {result: result}, sourceNode);
                }

                genro.setData(datapath, new gnr.GnrBag(result.attr));
                return result;
            }
        );
    };

    if(userObjectIsLoaded && !saveAs) {
        return saveCb();
    }

    this.dialog();
}
```

## Metodo `dialog()`

Mostra dialog per salvare/modificare oggetto utente:

```javascript
dialog() {
    var dlg = genro.dlg.quickDialog(title);
    var center = dlg.center;
    var box = center._('div', {datapath: datapath, padding: '20px'});
    var fb = genro.dev.formbuilder(box, 2, {border_spacing: '6px'});

    // Campi form
    fb.addField('textbox', {lbl: _T("Code"), value: '^.code', width: '10em'});
    fb.addField('checkbox', {label: _T("Private"), value: '^.private'});
    fb.addField('textbox', {lbl: _T("Name"), value: '^.description', width: '100%', colspan: 2});
    fb.addField('textbox', {lbl: _T("Authorization"), value: '^.authtags', width: '100%', colspan: 2});
    fb.addField('simpleTextArea', {
        lbl: _T("Notes"),
        value: '^.notes',
        width: '100%',
        height: '5ex',
        colspan: 2,
        lbl_vertical_align: 'top'
    });

    // Screenshot preview opzionale
    if(preview) {
        fb.addField('button', {
            action: function() {
                var that = this;
                dlg.getParentNode().widget.hide();
                genro.dev.takePicture(function(data) {
                    dlg.getParentNode().widget.show();
                    that.setRelativeData('.preview', data);
                });
            },
            label: _T('Screenshot')
        });
        fb.addField('br', {});
        fb.addField('img', {
            src: '^.preview',
            height: '50px',
            width: '200px',
            border: '1px solid silver'
        });
    }

    // Bottoni
    var bottom = dlg.bottom._('div');
    bottom._('button', {
        'float': 'right',
        label: _T('Save'),
        action: function(evt, counter, modifiers) {
            saveCb(dlg, evt, counter, modifiers);
        }
    });

    // Bottone duplica (se esiste già)
    var meta = genro.getData(datapath) || new gnr.GnrBag();
    if(meta.getItem('id') || meta.getItem('pkey')) {
        bottom._('button', {
            'float': 'right',
            label: _T('Duplicate as'),
            action: function(evt, counter, modifiers) {
                genro.getData(datapath).setItem('id', null);
                genro.getData(datapath).setItem('pkey', null);
                saveCb(dlg, evt, counter, modifiers);
            }
        });
    }

    bottom._('button', {
        'float': 'right',
        label: _T('Cancel'),
        action: dlg.close_action
    });

    dlg.show_action();
}
```

## Funzione `userObjectLoad`

Carica un oggetto utente:

```javascript
userObjectLoad: function(sourceNode, kw) {
    var metadataPath = objectPop(kw, 'metadataPath');
    var onLoaded = objectPop(kw, 'onLoaded');
    var onLoading = objectPop(kw, 'onLoading');

    var resback = function(result) {
        var resultValue, resultAttr, dataIndex;

        if(!result) {
            // Valori default se non esiste
            resultValue = new gnr.GnrBag(kw.defaultData);
            resultAttr = objectUpdate({}, kw.defaultMetadata);
            dataIndex = kw.dataIndex;
        } else {
            resultValue = result._value.deepCopy();
            resultAttr = objectUpdate({}, result.attr);
            dataIndex = resultValue.pop('__index__');
        }

        if(onLoading) {
            funcApply(onLoading, null, sourceNode,
                ['dataIndex', 'resultValue', 'resultAttr'],
                [dataIndex, resultValue, resultAttr]);
        }

        sourceNode.setRelativeData(metadataPath, new gnr.GnrBag(resultAttr));

        if(dataIndex) {
            if(dataIndex instanceof gnr.GnrBag) {
                dataIndex = dataIndex.asDict();
            }
            for(let k in dataIndex) {
                sourceNode.setRelativeData(dataIndex[k], resultValue.getItem(k));
            }
        }

        if(onLoaded) {
            funcApply(onLoaded, null, sourceNode,
                ['dataIndex', 'resultValue', 'resultAttr'],
                [dataIndex, resultValue, resultAttr]);
        }
    };

    if(kw.userObjectIdOrCode === '__newobj__') {
        return resback();
    }

    genro.serverCall('_table.adm.userobject.loadUserObject', kw, resback);
}
```

## Funzione `userObjectMenuData`

Genera menu dati per selezione oggetti utente:

```javascript
userObjectMenuData: function(kw, extraRows) {
    if(extraRows) {
        kw._onResult = function(result) {
            var offset = result.len();
            if(offset) {
                result.setItem('r_' + offset, null, {caption: '-'});
            }
            offset += 1;
            extraRows.forEach(function(n, i) {
                result.setItem('r_' + (i + offset), null, n);
            });
        };
    }
    var resolver = genro.rpc.remoteResolver(
        '_table.adm.userobject.userObjectMenu',
        kw
    );
    return resolver;
}
```

## Struttura Dati UserObject

### Metadata

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` / `pkey` | string | ID univoco |
| `code` | string | Codice identificativo |
| `description` | string | Nome descrittivo |
| `private` | boolean | Visibile solo all'utente |
| `authtags` | string | Tag autorizzazione |
| `notes` | string | Note testuali |
| `preview` | string | Screenshot base64 |

### Data

La struttura dati è variabile, con `__index__` che mappa i path:

```javascript
{
    key1: value1,
    key2: value2,
    __index__: {
        key1: 'path.to.data1',
        key2: 'path.to.data2'
    }
}
```

## RPC Endpoints

| Endpoint | Descrizione |
|----------|-------------|
| `_table.adm.userobject.saveUserObject` | Salva oggetto |
| `_table.adm.userobject.loadUserObject` | Carica oggetto |
| `_table.adm.userobject.userObjectMenu` | Lista oggetti per menu |

## Pattern Utilizzati

1. **Repository Pattern**: Persistenza tramite server
2. **DTO Pattern**: Data Transfer Object con metadata
3. **Builder Pattern**: FormBuilder per dialog
4. **Callback Pattern**: onSaved, onLoaded, onLoading

## Rilevanza per genro-bag-js

⭐⭐ Media

**Motivazione**:
- Mostra pattern di serializzazione Bag per persistenza
- Struttura `__index__` interessante per mapping dati
- Pattern di dialog con form builder

**Da considerare**:
- Pattern di serializzazione/deserializzazione Bag
- Struttura metadata + data
- Sistema di mapping path con `__index__`

## Note

1. **Server-Side Storage**: Dati salvati su server, non localStorage
2. **Authorization**: Supporto per tag autorizzazione
3. **Preview Screenshot**: Funzionalità screenshot per anteprima
4. **Duplicate**: Supporto per duplicazione oggetti esistenti
5. **Private Objects**: Oggetti visibili solo all'utente creatore
