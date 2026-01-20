# genro_google.js - Summary

**File**: `genro_google.js`
**Linee**: ~197
**Dimensione**: 8 KB
**Ultima modifica**: Legacy code

## Scopo

Widget handler per Google Charts. Fornisce integrazione con Google Visualization API per creare grafici da dati Bag o da grid esistenti.

## Dipendenze

- Dojo framework (`dojo.declare`)
- `genro` (oggetto globale applicazione)
- `gnr.GnrBag` (per conversione dati)
- Google Charts API (caricata dinamicamente)

## Costanti

### GoogleTypeConverter

Mapping tra tipi dati Genropy e tipi Google Charts:

```javascript
const GoogleTypeConverter = {
    'A': 'string',    // Alfanumerico
    'T': 'string',    // Text
    'C': 'string',    // Character
    'B': 'boolean',   // Boolean
    'D': 'date',      // Date
    'DH': 'datetime', // DateTime
    'N': 'number',    // Number
    'R': 'number',    // Real
    'L': 'number',    // Long
    'I': 'number'     // Integer
};
```

## Funzioni Utility

### `dataTableFromBag(data, columns, datamode)`

Converte una Bag in DataTable Google:

```javascript
const dataTableFromBag = function(data, columns, datamode) {
    if(!datamode) {
        datamode = data.getItem('#0') ? 'bag' : 'attr';
    }

    if(!columns) {
        let firstNode = data.getNode('#0');
        if(datamode == 'bag') {
            columns = firstNode.getValue().getNodes().map(n => {
                let dtype = guessDtype(n.getValue());
                return {
                    'type': GoogleTypeConverter[dtype] || 'string',
                    'label': n.label,
                    'field': n.label
                };
            });
        } else {
            // datamode == 'attr'
            columns = [];
            for(let key in firstNode.attr) {
                let dtype = guessDtype(firstNode.attr[key]);
                columns.push({
                    'type': GoogleTypeConverter[dtype] || 'string',
                    'label': key,
                    'field': key
                });
            }
        }
    }

    let result = new google.visualization.DataTable();
    for(let c of columns) {
        result.addColumn(c.type, c.label);
    }

    result.addRows(data.getNodes().map(n => {
        let r = [];
        let rowSource = datamode == 'bag' ? n.getValue().asDict() : n.attr;
        for(let c of columns) {
            r.push(rowSource[c.field]);
        }
        return r;
    }));

    return result;
};
```

### `hierarchicalDataTableFromBag(data)`

Crea DataTable gerarchica per OrgChart:

```javascript
const hierarchicalDataTableFromBag = function(data) {
    let result = new google.visualization.DataTable();
    result.addColumn('string', 'Caption');
    result.addColumn('string', 'Parent');

    result.addRows(data.getIndex().map(l => {
        return [
            {v: l[0].join('.'), f: l[1].attr.label},
            l[0].slice(0, -1).join('.')
        ];
    }));

    return result;
};
```

### `dataTableFromGrid(grid, given_columns)`

Converte dati di una grid in DataTable:

```javascript
const dataTableFromGrid = function(grid, given_columns) {
    if(typeof(grid) == 'string') {
        grid = genro.wdgById(grid);
    }

    let data = grid.storebag();
    let struct = grid.structbag();
    var columns = [];
    var cells = struct.getItem('view_0.rows_0');

    if(given_columns) {
        columns = given_columns.map(c => {
            let result = {...c};
            let cell = cells.getNodeByAttr('field', c.field).attr;
            if(!result.type) {
                result.type = GoogleTypeConverter[cell.dtype] || 'string';
            }
            result.label = result.label || cell.name || result.field;
            return result;
        });
    } else {
        columns = cells.getNodes().map(n => {
            return {
                'type': GoogleTypeConverter[n.attr.dtype] || 'string',
                'label': n.attr.name || n.attr.field,
                'field': n.attr.field_getter || n.attr.field
            };
        });
    }

    return dataTableFromBag(data, columns);
};
```

## Widget Class

### `gnr.widgets.GoogleChart`

```javascript
dojo.declare("gnr.widgets.GoogleChart", gnr.widgets.baseHtml, {
    constructor: function(application) {
        this._domtag = 'div';
    },

    creating: function(attributes, sourceNode) {
        let chartAttributes = objectExtract(attributes, 'chart_*', true);
        objectUpdate(chartAttributes, objectExtract(attributes, 'title'));
        attributes.id = attributes.nodeId || 'gchart_' + genro.getCounter();

        let connectedGrid = objectPop(attributes, 'grid');
        let columns = attributes.columns;
        sourceNode.attr._workspace = true;

        // Gestione columns come Bag
        if(columns && typeof(columns) != 'string') {
            let columnsBag = columns;
            if(!(columns instanceof gnr.GnrBag)) {
                columnsBag = new gnr.GnrBag();
                columns.forEach((c, idx) => {
                    columnsBag.addItem('r_' + idx, null, c);
                });
            }
            attributes.columns = '^#WORKSPACE.columns';
            sourceNode.setRelativeData('#WORKSPACE.columns', columnsBag);
        }

        sourceNode._connectedGrid = connectedGrid;
        sourceNode.attr.chartAttributes = chartAttributes;

        return {chartAttributes: chartAttributes};
    },

    created: function(widget, savedAttrs, sourceNode) {
        var that = this;
        var chartAttributes = objectPop(savedAttrs, 'chartAttributes');

        if(!genro.googlechart) {
            // Caricamento dinamico Google Charts
            genro.dom.loadJs('https://www.gstatic.com/charts/loader.js', () => {
                google.charts.load('current', {'packages': ['corechart']});
                google.charts.setOnLoadCallback(() =>
                    that.initialize(widget, chartAttributes, sourceNode)
                );
            });
        } else {
            this.initialize(widget, chartAttributes, sourceNode);
        }
    },

    initialize: function(widget, chartAttributes, sourceNode) {
        sourceNode._chartWrapper = new google.visualization.ChartWrapper({
            chartType: sourceNode.attr.chartType,
            dataTable: this.getDataTable(sourceNode),
            options: this.getOptions(sourceNode),
            containerId: sourceNode.attr.containerId
        });
        sourceNode._chartWrapper.draw();
    }
});
```

## Metodi Widget

| Metodo | Descrizione |
|--------|-------------|
| `getOptions(sourceNode)` | Restituisce opzioni chart |
| `getStruct(sourceNode, path)` | Ottiene struttura colonne |
| `getColumns(sourceNode, path)` | Ottiene definizione colonne |
| `getDataTable(sourceNode)` | Crea DataTable dai dati |

## Mixin Methods

```javascript
mixin_gnr_getDataTable: function() {
    this.gnr.getDataTable(this.sourceNode);
},

mixin_gnr_refresh: function() {
    this.sourceNode._chartWrapper.dataTable = this.gnr_getDataTable();
    this.sourceNode._chartWrapper.draw();
},

mixin_gnr_storepath: function(value) {
    this.gnr_refresh();
},

mixin_gnr_columns: function(value) {
    this.gnr_refresh();
},

mixin_gnr_structpath: function(value) {
    this.gnr_refresh();
}
```

## Tipi Chart Supportati

Tramite Google Visualization API:
- BarChart, ColumnChart
- LineChart, AreaChart
- PieChart, DonutChart
- ScatterChart
- OrgChart (gerarchico)
- E tutti gli altri tipi Google Charts

## Pattern Utilizzati

1. **Lazy Loading**: Google Charts caricato solo quando necessario
2. **Data Binding**: Reattivo a cambi dati tramite mixin
3. **Adapter Pattern**: Conversione Bag → DataTable
4. **Widget Pattern**: Estende gnr.widgets.baseHtml

## Rilevanza per genro-bag-js

⭐⭐ Media

**Motivazione**:
- Mostra pattern di conversione Bag → strutture esterne
- Utile come riferimento per integrazione con altre librerie chart
- Pattern di lazy loading librerie esterne

**Da considerare**:
- Pattern `dataTableFromBag` per serializzazione dati
- Approccio a conversione tipi dtype → tipi esterni
- Pattern widget con data binding reattivo

## Note

1. **Google Charts API**: Richiede connessione internet
2. **Lazy Loading**: Script caricato on-demand
3. **Chart Wrapper**: Usa ChartWrapper per flessibilità
4. **Grid Integration**: Può leggere dati direttamente da grid
5. **OrgChart**: Supporto speciale per grafici gerarchici
