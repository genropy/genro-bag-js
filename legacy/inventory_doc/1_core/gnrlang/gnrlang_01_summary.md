# gnrlang.js - Summary

**File**: `gnrlang.js`
**Linee**: 2232
**Dimensione**: 70 KB
**Ultima modifica**: 2025-11-29
**Copyright**: 2004-2007 Softwell sas (LGPL 2.1)

## Scopo

Utility functions fondamentali per tutto il sistema Genro. Contiene:
- Type detection e conversion
- Object/Array manipulation
- String utilities
- XML building
- Date/Time handling
- Formatting system (`gnrformatter`)
- Macro expansion (GET, SET, FIRE, PUBLISH)

## Dipendenze

- **Dojo**: `dojo.forEach`, `dojo.map`, `dojo.filter`, `dojo.indexOf`, `dojo.hitch`, `dojo.date.locale`, `dojo.number`, `dojo.currency`
- **genro**: Global application object (per storage, evaluate, serverCall, getData)
- **gnr.GnrBag**: Riferimenti per type checking

## Funzioni Chiave per genro-bag-js

### Type Detection

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `isBag` | `(value)` | Verifica se è una Bag (duck typing: `value.htraverse != null`) |
| `guessDtype` | `(value)` | Indovina il dtype: T, L, N, B, D, H, DH, X, AR, OBJ, NN, FUNC |
| `isNullOrBlank` | `(elem)` | `elem === null \|\| elem === undefined \|\| elem === ''` |
| `isDate` | `(obj)` | Verifica se è una Date |
| `isNumericType` | `(dtype)` | dtype in R, L, I, N |

### Type Conversion

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `convertFromText` | `(value, t, fromLocale)` | Stringa → tipo nativo (gestisce `::TYPE` suffix) |
| `convertToText` | `(value, params)` | Tipo nativo → `[dtype, string]` |
| `asTypedTxt` | `(value, dtype)` | Tipo nativo → stringa con `::TYPE` suffix |
| `asText` | `(value, params)` | Wrapper per `convertToText()[1]` |
| `mapConvertFromText` | `(value)` | Applica conversione ricorsiva a object/array |

### Object Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `objectUpdate` | `(obj, source, removeNulls)` | Merge source in obj |
| `objectPop` | `(obj, key, dflt)` | Estrae e rimuove chiave |
| `objectExtract` | `(obj, keys, dontpop, dontslice)` | Estrae chiavi (supporta `prefix_*` wildcard) |
| `objectKeys` | `(obj)` | Lista chiavi |
| `objectValues` | `(obj)` | Lista valori |
| `objectItems` | `(obj)` | Lista {key, value} |
| `objectSize` | `(obj)` | Conta proprietà |
| `objectNotEmpty` | `(obj)` | Verifica se ha proprietà |
| `objectIsEqual` | `(obj1, obj2)` | Confronto shallow |
| `isEqual` | `(a, b)` | Confronto con supporto Bag, Array, Date |
| `copyJson` | `(obj)` | Deep copy via JSON |
| `objectAsStyle` | `(obj)` | Oggetto → CSS style string |
| `objectFromStyle` | `(style)` | CSS style string → oggetto |
| `objectFromString` | `(values, sep, mode)` | Stringa → oggetto |
| `objectAsXmlAttributes` | `(obj, sep)` | Oggetto → attributi XML |

### Array Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `arrayContains` | `(arr, item)` | Verifica presenza |
| `arrayIndexOf` | `(arr, item)` | Trova indice |
| `arrayPushNoDup` | `(arr, item)` | Push se non duplicato |
| `arrayUniquify` | `(arr)` | Rimuove duplicati |
| `arrayMatch` | `(a, matchString)` | Filtra per pattern |
| `copyArray` | `(arraylike)` | Copia array |
| `zip` | `(list)` | Traspone matrice |

### String Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `stringStrip` | `(s)` | Trim whitespace |
| `stringStartsWith` | `(s, v)` | Inizia con |
| `stringEndsWith` | `(s, v)` | Finisce con |
| `stringContains` | `(s, v)` | Contiene |
| `stringCapitalize` | `(str, firstOnly)` | Capitalizza |
| `smartsplit` | `(path, on)` | Split con escape |
| `stringSplit` | `(s, c, n)` | Split con limite |
| `splitStrip` | `(s, sp)` | Split + trim |
| `templateReplace` | `(string, symbolsdict)` | `$var` → value |
| `stringHash` | `(str)` | Hash numerico |
| `stringToColour` | `(str)` | Stringa → colore hex |
| `flattenString` | `(str, forbidden, replacer)` | Normalizza stringa |

### XML Building

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `xml_buildTag` | `(tagName, value, attributes, xmlMode)` | Costruisce tag XML |
| `quoted` | `(astring)` | Quota stringa per XML |

### Formatting System (gnrformatter)

```javascript
gnrformatter.asText(value, {format: '...', dtype: '...', mask: '...'})
```

| Metodo | dtype | Descrizione |
|--------|-------|-------------|
| `format_T` | T | Testo (autolink, mailto, phone, etc.) |
| `format_D` | D | Data |
| `format_H` | H | Ora |
| `format_DH` | DH | DateTime |
| `format_B` | B | Booleano (semaphore, tick) |
| `format_L` | L | Intero |
| `format_N` | N | Numero (currency, bytes, DHMS) |
| `format_R` | R | Float |
| `format_P` | P | Immagine/Path |
| `format_X` | X | Bag |
| `format_AR` | AR | Array |
| `format_OBJ` | OBJ | Oggetto |

### Date/Time Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `deltaDays` | `(dateStart, dateEnd, excludeWD)` | Giorni tra date |
| `deltaWeeks` | `(dateStart, dateEnd, format)` | Settimane tra date |
| `addDaysToDate` | `(dateStart, daysToAdd, excludeWD)` | Aggiunge giorni |
| `combineDateAndTime` | `(date, time)` | Combina data e ora |
| `splitDateAndTime` | `(dt)` | Separa data e ora |
| `newTimeObject` | `(h, m, s, ms)` | Crea oggetto time |
| `localeParser` | `(value, options)` | Parse data localizzata |
| `timeStamp` | `()` | Timestamp corrente |

### Function Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `funcCreate` | `(fnc, pars, scope, showError)` | Crea funzione da stringa |
| `funcApply` | `(fnc, parsobj, scope, argNames, argValues)` | Applica funzione |

### Macro Expansion

| Funzione | Descrizione |
|----------|-------------|
| `macroExpand_GET` | `GET ^path` → `this.getRelativeData('path')` |
| `macroExpand_SET` | `SET ^path = val` → `this.setRelativeData('path', val)` |
| `macroExpand_PUT` | `PUT ^path = val` → `this.setRelativeData('path', val, null, false, false)` |
| `macroExpand_FIRE` | `FIRE ^path` → `this.setRelativeData('path', true, null, true)` |
| `macroExpand_PUBLISH` | `PUBLISH topic` → `genro.publish('topic')` |

### Altre Utilities

| Funzione | Signature | Descrizione |
|----------|-----------|-------------|
| `_T` | `(str, lazy)` | Traduzione locale |
| `_F` | `(val, format, dtype)` | Shortcut per formatting |
| `_IN` | `(val, str)` | Verifica se in lista comma-separated |
| `_px` | `(v)` | Aggiunge 'px' se mancante |
| `bagAsObj` | `(bag)` | Bag → JS object |
| `bagPathJoin` | `(path1, path2)` | Join path con `../` |
| `parseURL` | `(url)` | Parse URL components |
| `serializeURL` | `(parsedUrl)` | Ricostruisce URL |
| `dataTemplate` | `(str, data, path, ...)` | Template engine con `$field` |

## dtype Values

| dtype | Tipo | Note |
|-------|------|------|
| `T` | String | Text |
| `L` | Integer | Long |
| `N` | Float | Number |
| `R` | Float | Real |
| `I` | Integer | Integer |
| `B` | Boolean | |
| `D` | Date | Solo data |
| `H` | Time | Solo ora (1970-01-01 come base) |
| `DH` | DateTime | Data e ora |
| `DHZ` | DateTime+TZ | Con timezone |
| `X` | Bag | Bag XML |
| `AR` | Array | |
| `OBJ` | Object | |
| `NN` | Null | |
| `JS` | JSON | Stringa JSON |
| `FUNC` | Function | |
| `BAG` | Bag | Alias di X |
| `P` | Path/Image | |

## Rilevanza per genro-bag-js

⭐⭐⭐ **ALTA** - Questo file contiene utility essenziali usate da gnrbag.js.

### Da Portare (subset essenziale)

**Type system**:
- `isBag`, `guessDtype`, `isNullOrBlank`, `isDate`, `isNumericType`
- `convertFromText`, `convertToText`, `asTypedTxt`

**Object utilities**:
- `objectUpdate`, `objectPop`, `objectExtract`
- `objectKeys`, `objectValues`, `objectItems`
- `isEqual`, `objectNotEmpty`, `objectSize`

**String utilities**:
- `stringStrip`, `stringStartsWith`, `stringEndsWith`, `stringContains`
- `smartsplit`

**XML building**:
- `xml_buildTag`, `objectAsXmlAttributes`, `quoted`

**Array utilities**:
- `zip`, `arrayIndexOf`

### Da NON Portare (specifici per UI/Genro)

- `_T` (traduzione) - dipende da genro
- `dataTemplate` - dipende da genro e DOM
- Macro expansion (GET, SET, FIRE) - specifico per Genro UI
- `gnrformatter` - può essere modulo separato
- `funcCreate` - dipende da genro.evaluate
- URL parsing - già disponibile in browser/Node

## Note

1. **_gnrdtype**: Property custom sugli oggetti per preservare tipo originale
2. **Duck typing per Bag**: `isBag` usa `value.htraverse != null`
3. **Costanti**: `_lf`, `_crlf`, `_tab` definite ma poco usate
4. **Patch May 28**: Linee 2172-2175 contengono patch per bug dojo con 28 maggio

## File Correlati

- `gnrbag.js` - Usa queste utility per type conversion e XML
- Tutti gli altri moduli - dipendono da queste utility
