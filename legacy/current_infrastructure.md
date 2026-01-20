# Infrastruttura Corrente Genropy - Analisi per Porting JS

## Scenario d'Uso

### 1. WSGI (Gunicorn)
La configurazione attuale, usata in produzione.

### 2. ASGI (futuro)
L'evoluzione pianificata.

---

## Sistema di Compressione JS

### File Coinvolti

**`gnrpy/gnr/web/jsmin.py`**
- Implementazione Python del jsmin di Douglas Crockford (2007)
- Rimuove commenti e spazi bianchi
- Funzione principale: `jsmin(js)` → stringa minimizzata

**`gnrpy/gnr/web/gnrwebpage_proxy/jstools.py`**
- Classe `GnrWebJSTools` (proxy della pagina)
- Metodo chiave: `compress_js(jsfiles)`

### Logica di Compressione

```python
def compress_js(self, jsfiles):
    # 1. Calcola timestamp più recente tra i file
    ts = str(max([os.path.getmtime(fname) for fname in jsfiles]))

    # 2. Genera hash MD5 per caching
    key = '-'.join(jsfiles)
    cpfile = '%s.js' % hashlib.md5((key + ts).encode()).hexdigest()

    # 3. Verifica cache
    jspath = site.getStatic('site').path('_static', '_jslib', cpfile)
    if os.path.isfile(jspath):
        return jsurl  # Cache hit

    # 4. Ricostruisce: concatena e minimizza ogni file
    for fname in jsfiles:
        with open(fname) as f:
            js = f.read()
        cpf.write(jsmin(js, quote_chars="'\"`"))
        cpf.write('\n\n\n\n')

    return jsurl
```

### Caratteristiche

- **Cache basata su hash MD5** di (lista file + timestamp)
- **Atomicità**: usa file temporaneo + `shutil.move()`
- **Separatori**: 4 newline tra file (debug più facile)
- **Quote chars**: gestisce `'`, `"`, e ``` ` ``` (template literals)

---

## Strategia Debug vs Produzione

### Modalità Debug (Raccomandata)
- File JS separati, non minimizzati
- Source maps disponibili
- Errori con riferimenti leggibili
- Già supportata dall'infrastruttura esistente

### Modalità Produzione
- File concatenati e minimizzati
- Cache con hash MD5
- Singola richiesta HTTP

**Decisione**: Mantenere questa separazione, è una best practice standard.

---

## Bootstrap Page

### Situazione Attuale
- Template Mako (tecnologia 2006)
- Genera pagina XHTML 1.0 Transitional
- Include: Dojo toolkit, CSS multipli, script inline

### Evoluzione Proposta
Usare `HtmlBuilder` dal nuovo genro-bag Python:

```python
from genro_bag import Bag
from genro_bag.builders.html import HtmlBuilder

def build_bootstrap_page(config: dict) -> str:
    page = Bag(builder=HtmlBuilder)

    html = page.html(lang='it')
    head = html.head()
    head.meta(charset='utf-8')
    head.title(config['title'])

    for css in config['css_files']:
        head.link(rel='stylesheet', href=css)

    body = html.body()
    body.div(id='main_root')

    for js in config['js_files']:
        body.script(src=js)

    # Script di inizializzazione
    body.script(f"genro.start({json.dumps(config['genro_config'])});")

    return page.compile()
```

### Vantaggi
- Elimina dipendenza da Mako
- Stesso sistema (Bag + Builder) usato ovunque
- Più facile da testare e modificare
- Nessun linguaggio template da imparare

---

## Flusso Pagina Genropy

```
┌─────────────────────────────────────────────────────────────┐
│                      SERVER (Python)                        │
│                                                             │
│  1. Request HTTP                                            │
│  2. Costruisci config pagina                                │
│  3. HtmlBuilder → bootstrap HTML                            │
│  4. Response con HTML                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (JavaScript)                   │
│                                                             │
│  1. Parse HTML, carica JS/CSS                               │
│  2. genro.start(config)                                     │
│  3. Fetch "ricetta" UI (Bag XML/JSON)                       │
│  4. Costruisci/attiva DOM                                   │
│  5. Gestisci interazioni utente                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Ruolo di genro-bag-js

Nel nuovo sistema, `genro-bag-js` si occupa di:

1. **Ricevere configurazione** dal bootstrap
2. **Fetch ricetta** (Bag serializzata dal server)
3. **Deserializzare** XML/JSON → Bag JS
4. **Expand** (se ci sono macro/expander)
5. **Compile** → costruire/attivare DOM
6. **Gestire eventi** e aggiornamenti dinamici

**NON si occupa di**:
- Generare la pagina bootstrap (fatto da Python)
- Minificazione JS (fatto dal server)
- Routing HTTP (fatto dal server)

---

## Decisioni Tecniche per JS

### Confermate
- **JavaScript puro** (NO TypeScript)
  - Per programmazione generica i vantaggi di TS si perdono
  - No decoratori (non esistono in vanilla JS)
  - No metodi dunder (specifici Python)

- **ES6 Classes**
  - Più vicine al modello Python
  - Sintassi chiara e familiare

- **ESM Modules**
  - Standard moderno (`import`/`export`)
  - Funziona in browser e Node 18+
  - Tree-shaking possibile

### Ordine Implementazione
1. `Bag` + `BagNode` (core)
2. `Resolver` (lazy loading)
3. `Trigger`/`Subscription` (reattività)
4. `Builder` (ultimo, set aside per ora)

---

**Ultimo aggiornamento**: 2025-01-20
