var wms_layers = [];


        var lyr_OSMStandard_0 = new ol.layer.Tile({
            'title': 'OSM Standard',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' &nbsp &middot; <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, CC-BY-SA</a>',
                url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });
var format_Territorio_car_1 = new ol.format.GeoJSON();
var features_Territorio_car_1 = format_Territorio_car_1.readFeatures(json_Territorio_car_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Territorio_car_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Territorio_car_1.addFeatures(features_Territorio_car_1);
var lyr_Territorio_car_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Territorio_car_1, 
                style: style_Territorio_car_1,
                popuplayertitle: 'Territorio_car',
                interactive: true,
                title: '<img src="styles/legend/Territorio_car_1.png" /> Territorio_car'
            });
var format_MedidoresF_2 = new ol.format.GeoJSON();
var features_MedidoresF_2 = format_MedidoresF_2.readFeatures(json_MedidoresF_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_MedidoresF_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_MedidoresF_2.addFeatures(features_MedidoresF_2);
var lyr_MedidoresF_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_MedidoresF_2, 
                style: style_MedidoresF_2,
                popuplayertitle: 'MedidoresF',
                interactive: false,
                title: '<img src="styles/legend/MedidoresF_2.png" /> MedidoresF'
            });
var invisibleStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(0,0,0,0)'
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,0)',
    width: 0
  }),
  image: new ol.style.Circle({
    radius: 0
  })
});

lyr_MedidoresF_2.setStyle(invisibleStyle);

var format_Distritos_dentro_car_3 = new ol.format.GeoJSON();
var features_Distritos_dentro_car_3 = format_Distritos_dentro_car_3.readFeatures(json_Distritos_dentro_car_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Distritos_dentro_car_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Distritos_dentro_car_3.addFeatures(features_Distritos_dentro_car_3);
var lyr_Distritos_dentro_car_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Distritos_dentro_car_3, 
                style: style_Distritos_dentro_car_3,
                popuplayertitle: 'Distritos_dentro_car',
                interactive: true,
                title: '<img src="styles/legend/Distritos_dentro_car_3.png" /> Distritos_dentro_car'
            });
var format_CircuitosSecundarios_4 = new ol.format.GeoJSON();
var features_CircuitosSecundarios_4 = format_CircuitosSecundarios_4.readFeatures(json_CircuitosSecundarios_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_CircuitosSecundarios_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_CircuitosSecundarios_4.addFeatures(features_CircuitosSecundarios_4);
var lyr_CircuitosSecundarios_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_CircuitosSecundarios_4, 
                style: style_CircuitosSecundarios_4,
                popuplayertitle: 'Circuitos Secundarios',
                interactive: true,
    title: 'Circuitos Secundarios<br />\
    <img src="styles/legend/CircuitosSecundarios_4_0.png" /> 438<br />\
    <img src="styles/legend/CircuitosSecundarios_4_1.png" /> 74<br />\
    <img src="styles/legend/CircuitosSecundarios_4_2.png" /> 76<br />\
    <img src="styles/legend/CircuitosSecundarios_4_3.png" /> 79<br />\
    <img src="styles/legend/CircuitosSecundarios_4_4.png" /> 82<br />' });
var format_CircuitosPrimarios_5 = new ol.format.GeoJSON();
var features_CircuitosPrimarios_5 = format_CircuitosPrimarios_5.readFeatures(json_CircuitosPrimarios_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_CircuitosPrimarios_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_CircuitosPrimarios_5.addFeatures(features_CircuitosPrimarios_5);
var lyr_CircuitosPrimarios_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_CircuitosPrimarios_5, 
                style: style_CircuitosPrimarios_5,
                popuplayertitle: 'Circuitos Primarios',
                interactive: true,
    title: 'Circuitos Primarios<br />\
    <img src="styles/legend/CircuitosPrimarios_5_0.png" /> 438<br />\
    <img src="styles/legend/CircuitosPrimarios_5_1.png" /> 74<br />\
    <img src="styles/legend/CircuitosPrimarios_5_2.png" /> 76<br />\
    <img src="styles/legend/CircuitosPrimarios_5_3.png" /> 79<br />\
    <img src="styles/legend/CircuitosPrimarios_5_4.png" /> 82<br />' });
var format_Subestacin_6 = new ol.format.GeoJSON();
var features_Subestacin_6 = format_Subestacin_6.readFeatures(json_Subestacin_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Subestacin_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Subestacin_6.addFeatures(features_Subestacin_6);
var lyr_Subestacin_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_Subestacin_6, 
                style: style_Subestacin_6,
                popuplayertitle: ' Subestación ',
                interactive: true,
                title: '<img src="styles/legend/Subestacin_6.png" />  Subestación '
            });

lyr_OSMStandard_0.setVisible(true);lyr_Territorio_car_1.setVisible(true);lyr_MedidoresF_2.setVisible(true);lyr_MedidoresF_2.set('title', undefined);lyr_Distritos_dentro_car_3.setVisible(false);lyr_CircuitosSecundarios_4.setVisible(true);lyr_CircuitosPrimarios_5.setVisible(true);lyr_Subestacin_6.setVisible(true);
var layersList = [lyr_OSMStandard_0,lyr_Territorio_car_1,lyr_MedidoresF_2,lyr_Distritos_dentro_car_3,lyr_CircuitosSecundarios_4,lyr_CircuitosPrimarios_5,lyr_Subestacin_6];
lyr_Territorio_car_1.set('fieldAliases', {'AreaI': 'AreaI', 'Are Km': 'Are Km', });
lyr_MedidoresF_2.set('fieldAliases', {'MEDIDOR': 'MEDIDOR', 'COD_CIRC_1': 'COD_CIRC_1', });
lyr_Distritos_dentro_car_3.set('fieldAliases', {'DISTRITO': 'DISTRITO', 'CÓDIGO_DT': 'CÓDIGO_DT', 'PROVINCIA': 'PROVINCIA', 'CANTÓN': 'CANTÓN', });
lyr_CircuitosSecundarios_4.set('fieldAliases', {'NombreCirc': 'Nombre', 'COD_CIRCUI': 'Código circuito', 'COD_SUB': 'Código Subestación', 'RUTA': 'Ruta', 'TENSIN': 'Tensión (kV)', 'CapIntegra': 'Capacidad Integración (kW)', 'Cap Libre%': 'Capacidad Integración  libre (% kW)', 'Fecha_actu': 'Fecha Actualización', });
lyr_CircuitosPrimarios_5.set('fieldAliases', {'NombreCirc': 'Nombre', 'COD_CIRCUI': 'Codigo del circuito', 'COD_SUB': 'Codigo subestación', 'RUTA': 'Ruta', 'TENSIN': 'Tensión (kV)', 'CapIntegra': 'Capacidad Integración (kW)', 'Cap Libre%': 'Capacidad Integración  libre (% kVA)', 'Fecha actu': 'Fecha Actualización', });
lyr_Subestacin_6.set('fieldAliases', {'nombre_id': 'Nombre', 'codigo_cir': 'Circuito Alimentado', 'v_entrada': 'Voltaje Entrada', 'v1_salida': 'Voltaje Distribucion 1', 'v2_salida': 'Voltaje Distribucion 2', 'potencia': 'Potencia', 'x_i': 'x_i', 'y_i': 'y_i', 'codigo_dt': 'Codigo DT', 'codigo_sub': 'Codigo Subestacion ARESEP', 'nombre': 'Descripcion subestacion ARESEP', });
lyr_Territorio_car_1.set('fieldImages', {'AreaI': 'TextEdit', 'Are Km': 'TextEdit', });
lyr_MedidoresF_2.set('fieldImages', {'MEDIDOR': '', 'COD_CIRC_1': '', });
lyr_Distritos_dentro_car_3.set('fieldImages', {'DISTRITO': 'TextEdit', 'CÓDIGO_DT': 'TextEdit', 'PROVINCIA': 'TextEdit', 'CANTÓN': 'TextEdit', });
lyr_CircuitosSecundarios_4.set('fieldImages', {'NombreCirc': 'TextEdit', 'COD_CIRCUI': 'TextEdit', 'COD_SUB': 'TextEdit', 'RUTA': 'TextEdit', 'TENSIN': 'TextEdit', 'CapIntegra': 'TextEdit', 'Cap Libre%': 'TextEdit', 'Fecha_actu': 'DateTime', });
lyr_CircuitosPrimarios_5.set('fieldImages', {'NombreCirc': 'TextEdit', 'COD_CIRCUI': 'TextEdit', 'COD_SUB': 'TextEdit', 'RUTA': 'TextEdit', 'TENSIN': 'TextEdit', 'CapIntegra': 'TextEdit', 'Cap Libre%': 'TextEdit', 'Fecha actu': 'DateTime', });
lyr_Subestacin_6.set('fieldImages', {'nombre_id': 'TextEdit', 'codigo_cir': 'TextEdit', 'v_entrada': 'Range', 'v1_salida': 'Range', 'v2_salida': 'Range', 'potencia': 'Range', 'x_i': 'TextEdit', 'y_i': 'TextEdit', 'codigo_dt': 'Range', 'codigo_sub': 'Range', 'nombre': 'TextEdit', });
lyr_Territorio_car_1.set('fieldLabels', {'AreaI': 'hidden field', 'Are Km': 'hidden field', });
lyr_MedidoresF_2.set('fieldLabels', {'MEDIDOR': 'no label', 'COD_CIRC_1': 'no label', });
lyr_Distritos_dentro_car_3.set('fieldLabels', {'DISTRITO': 'hidden field', 'CÓDIGO_DT': 'hidden field', 'PROVINCIA': 'hidden field', 'CANTÓN': 'hidden field', });
lyr_CircuitosSecundarios_4.set('fieldLabels', {'NombreCirc': 'inline label - always visible', 'COD_CIRCUI': 'inline label - always visible', 'COD_SUB': 'header label - visible with data', 'RUTA': 'header label - visible with data', 'TENSIN': 'header label - visible with data', 'CapIntegra': 'header label - visible with data', 'Cap Libre%': 'header label - visible with data', 'Fecha_actu': 'header label - visible with data', });
lyr_CircuitosPrimarios_5.set('fieldLabels', {'NombreCirc': 'inline label - always visible', 'COD_CIRCUI': 'inline label - always visible', 'COD_SUB': 'inline label - visible with data', 'RUTA': 'inline label - always visible', 'TENSIN': 'inline label - always visible', 'CapIntegra': 'inline label - always visible', 'Cap Libre%': 'inline label - always visible', 'Fecha actu': 'inline label - always visible', });
lyr_Subestacin_6.set('fieldLabels', {'nombre_id': 'inline label - always visible', 'codigo_cir': 'inline label - always visible', 'v_entrada': 'inline label - always visible', 'v1_salida': 'inline label - visible with data', 'v2_salida': 'inline label - visible with data', 'potencia': 'inline label - visible with data', 'x_i': 'hidden field', 'y_i': 'hidden field', 'codigo_dt': 'inline label - visible with data', 'codigo_sub': 'inline label - visible with data', 'nombre': 'inline label - visible with data', });
lyr_Subestacin_6.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});