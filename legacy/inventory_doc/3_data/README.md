# 3. Data - Gestione Dati e Sincronizzazione

Store di dati, comunicazione real-time e oggetti condivisi.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [gnrstores](gnrstores/) | ~750 | Data stores (Virtual, Server, etc.) | ⭐⭐ Media |
| [gnrwebsocket](gnrwebsocket/) | ~600 | WebSocket client real-time | ⭐⭐ Media |
| [gnrsharedobjects](gnrsharedobjects/) | ~180 | Oggetti condivisi tra pagine | ⭐ Bassa |

## Dipendenze

```
gnrstores.js        ← store per grid/tree, usa Bag

gnrwebsocket.js     ← comunicazione real-time
    ↓
gnrsharedobjects.js ← sincronizzazione oggetti via websocket
```

## Classi Principali

### gnrstores.js
- `gnr.GnrStoreBag` - Store base per Bag
- `gnr.GnrVirtualStore` - Store virtualizzato per grandi dataset
- `gnr.GnrServerStore` - Store con paginazione server-side

### gnrwebsocket.js
- `gnr.GnrWebSocketHandler` - Gestione connessione WS
- Publish/Subscribe per eventi real-time
- Reconnection automatica

### gnrsharedobjects.js
- `gnr.GnrSharedObjectsHandler` - Sincronizzazione oggetti
- Usa WebSocket per propagare modifiche

## Rilevanza per genro-bag-js

**Pattern di store e virtualizzazione utili come riferimento.**

- `GnrStoreBag` mostra come wrappare Bag per widget
- `GnrVirtualStore` pattern per grandi dataset
- WebSocket pattern per sync real-time

## Pattern Chiave

1. **Store Abstraction**: Interfaccia uniforme per diverse sorgenti dati
2. **Virtual Scrolling**: Caricamento on-demand per performance
3. **Pub/Sub**: Pattern publish/subscribe per eventi
4. **Reconnection**: Gestione disconnessioni WebSocket
