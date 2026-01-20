# genro_rpc.js - Summary

**File**: `genro_rpc.js`
**Linee**: 1046
**Dimensione**: 41 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Handler per chiamate remote (RPC) al server Genro. Gestisce chiamate HTTP GET/POST, WebSocket, upload multipart, polling, e resolver remoti per dati Bag.

**Classi definite:**
- `gnr.GnrRemoteResolver` - Resolver per dati remoti (estende GnrBagResolver)
- `gnr.GnrServerCaller` - Caller legacy per metodi server
- `gnr.GnrRpcHandler` - Handler principale RPC (`genro.rpc`)

## Dipendenze

- **Dojo**: `dojo.declare`, `dojo.xhrGet`, `dojo.xhrPost`, `dojo.rawXhrPost`, `dojo.xhrDelete`, `dojo.xhrPut`
- **gnr.GnrBag**: Container dati per risposte
- **gnr.GnrBagResolver**: Base class per resolver
- **genro**: Global application object

## GnrRemoteResolver

Resolver che carica dati da server remoto.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `xhrKwargs` | Configurazione XHR (handleAs, timeout, sync...) |
| `httpMethod` | Metodo HTTP ('POST', 'GET', 'WSK') |
| `onloading` | Callback pre-caricamento |
| `onResult` | Callback post-risultato |
| `onCalling` | Callback pre-chiamata |

### Metodi

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `constructor` | `(kwargs, isGetter, cacheTime)` | Inizializza resolver |
| `load` | `(kwargs)` | Esegue chiamata server |
| `errorHandler` | `(response, ioArgs)` | Gestisce errori |
| `resultHandler` | `(response, ioArgs)` | Processa risposta XML |

### xhrKwargs Default

```javascript
{
    handleAs: 'xml',
    timeout: 50000,
    load: 'resultHandler',
    error: 'errorHandler',
    sync: false,
    preventCache: false
}
```

## GnrRpcHandler

Handler principale per tutte le chiamate RPC.

### Proprietà

| Proprietà | Descrizione |
|-----------|-------------|
| `application` | Riferimento a genro |
| `counter` | Contatore chiamate |
| `rpc_register` | Registro chiamate attive |
| `rpc_counter` | Contatore totale |
| `rpc_level` | Livello nidificazione |
| `dynRequires` | Cache risorse caricate dinamicamente |

### Metodi Principali

#### Core RPC

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `_serverCall` | `(callKwargs, xhrKwargs, httpMethod)` | Chiamata server core |
| `_serverCall_execute` | `(httpMethod, kw, callKwargs)` | Esecuzione XHR |
| `remoteCall` | `(method, params, mode, httpMethod, preventCache, async_cb)` | Chiamata remote alto livello |
| `downloadCall` | `(method, kwargs)` | Chiamata con download risultato |

#### Registration

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `register_call` | `(kw)` | Registra chiamata attiva |
| `unregister_call` | `(ioArgs)` | Deregistra chiamata completata |
| `hasPendingCall` | `()` | Verifica chiamate pendenti |
| `suspend_call` | `(rpc_counter)` | Sospende timeout chiamata |

#### Response Processing

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `resultHandler` | `(response, ioArgs, currentAttr)` | Processa risposta XML |
| `errorHandler` | `(response, ioArgs)` | Gestisce errori HTTP |
| `setDatachangesInData` | `(datachanges)` | Applica cambiamenti dal server |
| `loadRequires` | `(envelope)` | Carica JS/CSS richiesti |

#### URL Building

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `rpcUrl` | `(method, kwargs, sourceNode, avoidCache)` | URL per chiamata RPC |
| `pageIndexUrl` | `()` | URL pagina corrente |
| `makoUrl` | `(template, kwargs)` | URL per template Mako |
| `getURLParams` | `(source)` | Estrae parametri da URL |
| `getRpcUrlArgs` | `(method, kwargs, sourceNode, avoidCache)` | Costruisce args URL |

#### Resolver Factory

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `remoteResolver` | `(methodname, params, kw)` | Crea resolver remoto |
| `remote_relOneResolver` | `(params, parentbag)` | Resolver relazione 1:1 |
| `remote_relManyResolver` | `(params)` | Resolver relazione 1:N |

#### Upload

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `uploadMultipartFiles` | `(filebag, kw)` | Upload multiplo file |
| `uploadMultipart_oneFile` | `(file, params, kw)` | Upload singolo file |

#### Polling

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `ping` | `(kw)` | Ping server (keep-alive) |
| `setPollingStatus` | `(status)` | Imposta stato polling |

#### Utility

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `serializeParameters` | `(kwargs)` | Serializza parametri per trasmissione |
| `addDeferredCb` | `(deferred, func, cblocals, sourceNode)` | Aggiunge callback a Deferred |
| `profileTime` | `(xhr)` | Raccoglie metriche tempo |
| `getRecordCount` | `(field, value, cb, kw)` | Conta record |

## Pattern Importanti

### Chiamata RPC Base

```javascript
// Chiamata sincrona
var result = genro.rpc.remoteCall('myMethod', {param1: 'value'});

// Chiamata asincrona
genro.rpc.remoteCall('myMethod', {param1: 'value'}, 'bag', 'POST', false,
    function(result, error) {
        if (error) {
            console.error(error);
        } else {
            // usa result
        }
    });
```

### Response Envelope

```javascript
// Risposta XML dal server
<envelope>
    <result>...</result>
    <resultType>node|value</resultType>
    <dataChanges>
        <change change_path="path" change_attr="...">value</change>
    </dataChanges>
    <js_requires>{"key": "url"}</js_requires>
    <css_requires>{"key": "url"}</css_requires>
    <error>...</error>
</envelope>
```

### Data Changes dal Server

```javascript
// Server può pushare cambiamenti
setDatachangesInData: function(datachanges) {
    datachanges.forEach(function(changenode) {
        var path = changenode.attr.change_path;
        var value = changenode.getValue();
        genro._data.setItem(path, value);
    });
}
```

### Remote Resolver

```javascript
// Crea resolver per Bag
var resolver = genro.rpc.remoteResolver('getData', {table: 'users'}, {
    cacheTime: 60,    // Cache per 60 secondi
    isGetter: false,
    sync: false
});

// Assegna a nodo Bag
bag.setItem('users', null, {}, {resolver: resolver});

// Caricamento automatico quando acceduto
var users = bag.getItem('users');  // Chiama server
```

### Relazione One Resolver

```javascript
// Resolver per relazione @foreignkey
resolver = genro.rpc.remote_relOneResolver({
    _from_fld: 'orders.customer_id',
    _target_fld: 'customers.id',
    _auto_relation_value: 'customer_id'  // Campo che trigghera reload
}, parentBag);
```

### Upload Multipart

```javascript
// Upload file con progress
genro.rpc.uploadMultipart_oneFile(file, {
    uploadPath: '/uploads/'
}, {
    method: 'rpc.upload_file',
    uploaderId: 'myUploader',
    onProgress: function(evt) {
        console.log(evt.loaded / evt.total * 100 + '%');
    },
    onResult: function(e) {
        console.log('Upload complete');
    }
});
```

### Ping/Polling

```javascript
// Ping per keep-alive e ricevere push dal server
ping: function(kw) {
    var pingKw = {
        page_id: genro.page_id,
        _lastUserEventTs: genro.getServerLastTs(),
        _lastRpc: genro.getServerLastRpc(),
        _pageProfilers: genro.getTimeProfilers()
    };
    this._serverCall(pingKw, xhrKwargs, 'POST');
}
```

## Formati Supportati

### handleAs

| Valore | Descrizione |
|--------|-------------|
| `xml` | Risposta XML → Bag |
| `json` | Risposta JSON |
| `text` | Risposta testuale |

### httpMethod

| Valore | Descrizione |
|--------|-------------|
| `GET` | HTTP GET |
| `POST` | HTTP POST |
| `PUT` | HTTP PUT |
| `DELETE` | HTTP DELETE |
| `WSK` | WebSocket |

## Headers Custom

```javascript
// Headers letti dalla risposta
X-GnrTime          // Tempo server
X-GnrSqlTime       // Tempo SQL
X-GnrSqlCount      // Conteggio query SQL
X-GnrXMLTime       // Tempo serializzazione XML
X-GnrXMLSize       // Dimensione XML
```

## Rilevanza per genro-bag-js

⭐⭐ **MEDIA** - Contiene pattern per resolver remoti che potrebbero essere utili per genro-bag-js.

### Concetti Utili

- Pattern GnrRemoteResolver per lazy loading
- Serializzazione parametri Bag per trasmissione
- Response handling con dataChanges
- Deferred/Promise pattern con callback

### Da Studiare

- **GnrRemoteResolver**: Come estendere GnrBagResolver per dati remoti
- **serializeParameters**: Serializzazione Bag per trasmissione
- **resultHandler**: Parsing risposta XML in Bag

### Da NON Portare

- Dipendenza Dojo XHR (usare fetch/axios moderni)
- Integrazione genro global
- Ping/polling specifico Genro
- Debug SQL integration

## Note

1. **page_id**: Ogni chiamata include page_id per identificazione sessione
2. **rpc_register**: Tracking chiamate per debugging e timeout
3. **dataChanges**: Server può pushare modifiche client-side
4. **dynRequires**: Caricamento dinamico JS/CSS richiesti dalla risposta
5. **serializeParameters**: Converte Bag e tipi complessi in stringhe

## File Correlati

- `gnrbag.js` - GnrBagResolver (base class)
- `gnrwebsocket.js` - WebSocket per WSK method
- `genro.js` - Applicazione (usa genro.rpc)
- `gnrdomsource.js` - sourceNode per contesto
