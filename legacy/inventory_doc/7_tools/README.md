# 7. Tools - Sviluppo e Utilities

Strumenti di sviluppo, patch e gestione oggetti utente.

## Moduli

| Modulo | Linee | Descrizione | Rilevanza |
|--------|-------|-------------|-----------|
| [genro_dev](genro_dev/) | ~1560 | Dev tools, inspector | ⭐ Bassa |
| [genro_patch](genro_patch/) | ~1420 | Patch Dojo widgets | ⭐ Bassa |
| [genro_uo](genro_uo/) | ~190 | User objects persistence | ⭐⭐ Media |

## Dipendenze

```
genro_dev.js    ← strumenti sviluppo, debug

genro_patch.js  ← fix per widget Dojo

genro_uo.js     ← salvataggio preferenze utente
```

## Classi Principali

### genro_dev.js
- `gnr.GnrDevHandler` - Strumenti sviluppo
- Inspector DOM/Bag
- FormBuilder programmatico
- Error handling

### genro_patch.js
- `genropatches` - Collezione patch
- Fix per Dojo widgets
- Polyfill browser

### genro_uo.js
- `UserObjectHandler` - Oggetti utente
- Save/Load preferenze
- Dialog metadata

## Rilevanza per genro-bag-js

**genro_uo.js mostra pattern di serializzazione Bag per persistenza.**

- Pattern save/load con metadata
- Struttura `__index__` per mapping path

## Pattern Chiave

1. **Inspector Pattern**: Navigazione struttura dati
2. **Monkey Patching**: Override metodi esistenti
3. **User Preferences**: Persistenza configurazioni
4. **FormBuilder**: Costruzione form programmatica
