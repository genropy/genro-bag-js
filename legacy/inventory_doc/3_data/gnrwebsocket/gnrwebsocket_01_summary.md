# gnrwebsocket.js - Summary

**File**: `gnrwebsocket.js`
**Linee**: 631
**Dimensione**: 24 KB
**Ultima modifica**: N/A
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1) + MIT (ReconnectingWebSocket)

## Scopo

Gestione WebSocket per comunicazione real-time client-server. Contiene:
- `gnr.GnrWebSocketHandler` - Handler Genro per WebSocket
- `ReconnectingWebSocket` - Libreria di terze parti per auto-reconnect

## Dipendenze

- **gnr.GnrBag**: Per parsing messaggi XML
- **genro**: Oggetto applicazione globale (page_id, publish, rpc, setData)
- **dojo**: `dojo.Deferred`, `dojo.toJson`
- **ReconnectingWebSocket**: Incluso nel file (MIT license, Joe Walnes)

## GnrWebSocketHandler

### Configurazione

| Proprietà | Default | Descrizione |
|-----------|---------|-------------|
| `application` | - | Riferimento applicazione |
| `wsroot` | - | Path root WebSocket |
| `url` | Calcolato | `ws://` o `wss://` + host + wsroot |
| `options.debug` | `false` | Modalità debug |
| `options.reconnectInterval` | `4000` | Intervallo riconnessione (ms) |
| `options.ping_time` | `1000` | Intervallo ping (ms) |
| `waitingCalls` | `{}` | Chiamate in attesa di risposta |

### Metodi Principali

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `create` | `()` | Crea e connette WebSocket |
| `send` | `(command, kw)` | Invia comando (fire-and-forget) |
| `call` | `(kw, omitSerialize, cb)` | Invia e attende risposta (Deferred) |
| `ping` | `()` | Invia ping con lastEventAge |
| `addhandler` | `(name, cb)` | Aggiunge handler dinamico |
| `parseResponse` | `(response)` | Parse XML response in GnrBag |

### Event Handlers

| Metodo | Descrizione |
|--------|-------------|
| `onopen` | Invia 'connected' con page_id, avvia ping interval |
| `onclose` | Ferma ping interval |
| `onerror` | Log errore |
| `onmessage` | Dispatch a receivedCommand o receivedToken |

### Comandi Ricevuti (do_*)

| Handler | Descrizione |
|---------|-------------|
| `do_alert` | Alert browser |
| `do_set` | Imposta dati in genro._data |
| `do_setInClientData` | Imposta dati relativi a nodo |
| `do_datachanges` | Applica datachanges dal server |
| `do_sharedObjectChange` | Aggiorna shared object |
| `do_publish` | Pubblica topic dojo |

### Metodi di Invio

| Metodo | Signature | Descrizione |
|--------|-----------|-------------|
| `sendCommandToPage` | `(page_id, command, data)` | Invia comando a pagina specifica |
| `setInClientData` | `(page_id, path, data)` | Set dati in altra pagina |
| `fireInClientData` | `(page_id, path, data)` | Fire dati in altra pagina |
| `publishToClient` | `(page_id, topic, data)` | Pubblica topic in altra pagina |

### Protocollo Messaggi

**Invio (JSON):**
```javascript
{
    command: 'commandName',
    result_token: 'wstk_123',  // se call()
    // ... altri parametri
}
```

**Ricezione (XML o plain text):**
```xml
<?xml version="1.0"?>
<root>
    <token>wstk_123</token>  <!-- se risposta a call() -->
    <envelope>
        <data>...</data>
        <error>...</error>
    </envelope>
</root>
```

oppure per comandi:
```xml
<root>
    <command>commandName</command>
    <data>...</data>
</root>
```

## ReconnectingWebSocket

Libreria di terze parti (MIT license, Joe Walnes) per WebSocket con auto-reconnect.

### Opzioni

| Opzione | Default | Descrizione |
|---------|---------|-------------|
| `debug` | `false` | Log debug |
| `automaticOpen` | `true` | Connetti subito |
| `reconnectInterval` | `1000` | Delay riconnessione base (ms) |
| `maxReconnectInterval` | `30000` | Delay massimo (ms) |
| `reconnectDecay` | `1.5` | Fattore incremento delay |
| `timeoutInterval` | `2000` | Timeout connessione (ms) |
| `maxReconnectAttempts` | `null` | Max tentativi (null = infinito) |

### Proprietà Read-Only

| Proprietà | Descrizione |
|-----------|-------------|
| `url` | URL connessione |
| `reconnectAttempts` | Numero tentativi |
| `readyState` | Stato (CONNECTING, OPEN, CLOSING, CLOSED) |
| `protocol` | Sub-protocol selezionato |

### Metodi

| Metodo | Descrizione |
|--------|-------------|
| `open(reconnectAttempt)` | Apre connessione |
| `send(data)` | Invia dati (queue se non connesso) |
| `close(code, reason)` | Chiude connessione |
| `refresh()` | Chiude e riapre |

### Eventi

| Evento | Descrizione |
|--------|-------------|
| `onopen` | Connessione aperta |
| `onclose` | Connessione chiusa |
| `onconnecting` | Tentativo connessione |
| `onmessage` | Messaggio ricevuto |
| `onerror` | Errore |

### Feature

- **Exponential backoff**: Delay riconnessione cresce esponenzialmente
- **Pending queue**: Messaggi inviati durante disconnessione vengono accodati
- **UMD module**: Supporta AMD, CommonJS, global

## Rilevanza per genro-bag-js

⭐ **BASSA** - WebSocket è specifico per comunicazione Genro server-client.

### Concetti Utili

- Pattern per gestione WebSocket con auto-reconnect
- Serializzazione Bag ↔ XML per messaggi
- Sistema di token per call/response

### Da NON Portare

- Handler specifici Genro (do_set, do_publish, etc.)
- Integrazione con genro._data
- Shared objects handling

### Eventuale Uso

Se genro-bag-js dovesse supportare sync remoto, un modulo simile potrebbe essere creato, ma con architettura diversa (es. WebSocket native con Promise invece di Deferred).

## Note

1. **Ping/Pong**: Heartbeat ogni secondo con `lastEventAge`
2. **Token system**: Ogni `call()` genera token unico per matching risposta
3. **Shared Objects**: `do_sharedObjectChange` gestisce oggetti condivisi tra pagine
4. **Message queue**: ReconnectingWebSocket accoda messaggi durante disconnessione
5. **Command routing**: Supporta `command` con `.` per routing (`genro.sub.do_method`)

## File Correlati

- `gnrsharedobjects.js` - Gestione shared objects
- `genro_rpc.js` - RPC calls (complementare a WebSocket)
- `gnrbag.js` - Serializzazione XML
