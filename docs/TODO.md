# Da fare

## Allineamento con genro-bag Python

Decisioni concordate durante la revisione delle differenze, implementate e verificate
l'8 settembre 2026. Dettagli d'uso: [python-alignment.md](python-alignment.md).

- [x] Distribuzione: TYTX 0.15.0 include `getRegisteredType`; Bag JS 0.4.0
  dipende dal tag Git pubblico via HTTPS e dal commit fissato nel lockfile.
  Rimossa la dipendenza dal checkout locale.

- [x] **Rami Bag con tipi TYTX condivisi tra Python e JavaScript** (8 settembre 2026).
  Una classe Python può avere una controparte JavaScript: il suffisso TYTX
  identifica il tipo condiviso, mentre ciascun runtime usa la propria classe.
  - Verificare il supporto della versione JS di `genro-tytx` e riutilizzarne
    il registro per associare esplicitamente suffissi e classi JS.
  - Serializzare ogni ramo con il suffisso della sua classe e ricostruirlo
    usando la classe JS registrata, preservando alberi con tipi misti.
  - Segnalare un errore quando il tipo di un ramo non è disponibile o il
    riferimento al genitore non è risolvibile; non spostare i figli alla radice.
  - Verificare round-trip Python/JS, alberi misti, tipi sconosciuti e genitori
    mancanti, nei formati TYTX JSON e MessagePack, normali e compatti.

  Verifica del prerequisito TYTX completata l'8 settembre 2026:
  la dipendenza installata `v0.7.4` non espone API di registrazione.
  Il checkout locale di `genro-tytx` al tag `v0.14.0` (`362addd`)
  espone `registerClass` e `registerType`; i 38 test di
  `js/test/test_registry.js` passano, inclusi sottoclassi, marker vuoti
  e tipi personalizzati in JSON, XML e MessagePack.
  Il manifest JS indica ancora `0.9.0` e `__version__` indica `0.7.4`:
  identificare quindi la dipendenza tramite il tag/commit verificato.

  Indicazioni per l'implementazione:
  - Aggiornare dipendenza e lockfile insieme all'adattamento della Bag.
  - Registrare Bag con `static tytxSuffix = 'X'`; ogni sottoclasse
    trasportabile con identità propria dichiara e registra un suffisso
    distinto. Il registro usa il costruttore esatto e rifiuta collisioni.
  - Adattare `fromTytx` al payload vuoto (Bag vuota) e alla costruzione
    tramite la classe ricevente, evitando `new Bag()` fisso per la radice.
  - Gestire i rami già ricostruiti dal decoder JSON e i marker strutturali
    rimasti stringhe in MessagePack, senza decodificare indiscriminatamente
    stringhe scalari che assomigliano a marker TYTX.
  - Per riconoscere questi marker serve consultare il tipo registrato:
    `SUFFIX_TO_TYPE` esiste internamente ma non è esposto dall'entry point
    pubblico. Definire un accesso pubblico al registro in TYTX, evitando
    import interni o un secondo registro indipendente nella Bag.
  - Il decoder TYTX conserva i suffissi sconosciuti come testo: la Bag
    deve validare i riferimenti ai genitori. Un marker sconosciuto senza
    figli non è distinguibile con certezza da testo scalare nel formato
    attuale; non promettere un riconoscimento universale dei rami ignoti.

- [x] **Conservazione di `nodeTag` e `xmlTag` durante `update()`** (8 settembre 2026).
  Allineare il merge da una Bag alla semantica Python: sui nodi nuovi copiare
  entrambi i tag; sui nodi esistenti un tag sorgente non nullo sostituisce
  quello di destinazione, mentre un tag sorgente nullo lo lascia invariato.
  Applicare la regola anche nei merge ricorsivi e mantenere invariato il
  comportamento delle sorgenti costituite da oggetti ordinari, prive di tag.
  Verificare inserimento, collisione, tag nulli e merge di Bag annidate.

- [x] **Conservazione di `nodeTag` nella serializzazione TYTX e JSON** (8 settembre 2026).
  Usare la proprietà interna `nodeTag` sia in scrittura sia in lettura,
  correggendo l'uso di `node.tag` nel percorso TYTX e l'omissione del tag
  nel percorso JSON. Mantenere il formato del protocollo: colonna tag nelle
  righe TYTX e campo `"tag"` nel JSON.
  Il tag del nodo è distinto dal suffisso TYTX che identifica la classe
  della Bag. Verificare la conservazione di `nodeTag` nei round-trip JS
  e Python/JS, inclusi nodi annidati e nodi senza tag.

- [x] **Query degli attributi e risoluzione dei resolver** (8 settembre 2026).
  `n?` deve restituire un oggetto con tutti gli attributi del nodo;
  `n?attr` un singolo valore e `n?a&b` un array dei valori richiesti,
  nell'ordine indicato. Risolvere i resolver contenuti negli attributi
  usando i loro parametri, senza ereditare quelli del nodo.
  In lettura statica restituire gli oggetti resolver senza eseguirli.
  Se tutti i valori sono sincroni, restituire il risultato immediatamente;
  se almeno un valore richiesto è asincrono, restituire una Promise del
  risultato completo, senza Promise annidate nell'oggetto o nell'array.
  Verificare query singole, multiple e complete, attributi vuoti,
  resolver sincroni e asincroni anche misti, e assenza di esecuzione
  durante la lettura statica.

- [x] **Serializzazione dei resolver e controparti JS** (8 settembre 2026).
  Supportare il protocollo Python dei resolver in TYTX, JSON e XML,
  sia come resolver del nodo sia come valore di un attributo.
  Ricostruire i resolver con controparte JS tramite un registro esplicito;
  conservare come dati opachi le descrizioni degli altri resolver, in modo
  da poterle rimandare al server senza perdita di informazioni.
  La deserializzazione non deve eseguire i resolver. L'eventuale esecuzione
  remota di un resolver solo server richiede un meccanismo separato e non
  è inclusa in questa decisione.
  Conservare i payload firmati ricevuti e le loro firme; la chiave segreta
  resta sul server, che verifica il payload al ritorno.
  Verificare round-trip Python/JS nei tre formati, resolver registrati e
  opachi, resolver negli attributi, conservazione dei payload firmati e
  assenza di esecuzione durante la deserializzazione.

- [x] **Adattamento dell'esistente `StorageResolver` con `dtype`** (8 settembre 2026).
  Mantenere un'unica classe e l'opzione attuale `storageType: 'local'`
  oppure `'session'`, senza introdurre `LocalStorageResolver`,
  `SessionStorageResolver` o un porting di `EnvResolver`.
  Aggiungere il parametro opzionale `dtype` per convertire i valori letti
  tramite TYTX, adattando la funzionalità Python alla sorgente Web Storage.
  Senza `dtype` mantenere il comportamento esistente. Verificare entrambi
  gli storage, conversioni, valori non convertibili e gestione di chiavi
  mancanti e `defaultValue` rispetto al contratto Python.

Differenza esclusa dal porting: `DataChangeCollector` è stato rimosso da
genro-bag Python 0.22.0 (commit `f176f39`, verificato l'8 settembre 2026).
La sua assenza in JS non costituisce quindi un disallineamento da colmare.

Divergenza intenzionale (8 settembre 2026): non replicare la separazione
Python tra resolver sincroni e asincroni. La differenza di runtime giustifica
il mantenimento di un'unica `BagCbResolver` JS, con callback che restituiscono
valori immediati oppure Promise; non introdurre classi separate per parità
nominale con Python.

La revisione delle differenze individuate è conclusa. Verifica: 529 test JS,
39 test del registro TYTX e 20 test cross-language superati.
