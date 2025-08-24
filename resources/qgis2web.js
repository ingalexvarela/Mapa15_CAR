
var map = new ol.Map({
    target: 'map',
    renderer: 'canvas',
    layers: layersList,
    view: new ol.View({
         maxZoom: 28, minZoom: 1
    })
});

//initial view - epsg:3857 coordinates if not "Match project CRS"
map.getView().fit([-9410690.896107, 1134921.305357, -9377533.761442, 1151767.590546], map.getSize());

////small screen definition
    var hasTouchScreen = map.getViewport().classList.contains('ol-touch');
    var isSmallScreen = window.innerWidth < 650;

////controls container

    //top left container
    var topLeftContainer = new ol.control.Control({
        element: (() => {
            var topLeftContainer = document.createElement('div');
            topLeftContainer.id = 'top-left-container';
            return topLeftContainer;
        })(),
    });
    map.addControl(topLeftContainer)

    //bottom left container
    var bottomLeftContainer = new ol.control.Control({
        element: (() => {
            var bottomLeftContainer = document.createElement('div');
            bottomLeftContainer.id = 'bottom-left-container';
            return bottomLeftContainer;
        })(),
    });
    map.addControl(bottomLeftContainer)
  
    //top right container
    var topRightContainer = new ol.control.Control({
        element: (() => {
            var topRightContainer = document.createElement('div');
            topRightContainer.id = 'top-right-container';
            return topRightContainer;
        })(),
    });
    map.addControl(topRightContainer)

    //bottom right container
    var bottomRightContainer = new ol.control.Control({
        element: (() => {
            var bottomRightContainer = document.createElement('div');
            bottomRightContainer.id = 'bottom-right-container';
            return bottomRightContainer;
        })(),
    });
    map.addControl(bottomRightContainer)

//popup
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var sketch;

closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container,
	autoPan: true
});
map.addOverlay(overlayPopup)
    
    
var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}

//highligth collection
var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = false;
var doHover = false;

function createPopupField(currentFeature, currentFeatureKeys, layer) {
    var popupText = '';
    for (var i = 0; i < currentFeatureKeys.length; i++) {
        if (currentFeatureKeys[i] != 'geometry' && currentFeatureKeys[i] != 'layerObject' && currentFeatureKeys[i] != 'idO') {
            var popupField = '';
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "hidden field") {
                continue;
            } else if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - visible with data") {
                if (currentFeature.get(currentFeatureKeys[i]) == null) {
                    continue;
                }
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - always visible" ||
                layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label - visible with data") {
                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + '</th><td>';
            } else {
                popupField += '<td colspan="2">';
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - visible with data") {
                if (currentFeature.get(currentFeatureKeys[i]) == null) {
                    continue;
                }
            }
            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - always visible" ||
                layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label - visible with data") {
                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + '</strong><br />';
            }
            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
				popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
			} else {
				var fieldValue = currentFeature.get(currentFeatureKeys[i]);
				if (/\.(gif|jpg|jpeg|tif|tiff|png|avif|webp|svg)$/i.test(fieldValue)) {
					popupField += (fieldValue != null ? '<img src="images/' + fieldValue.replace(/[\\\/:]/g, '_').trim() + '" /></td>' : '');
				} else if (/\.(mp4|webm|ogg|avi|mov|flv)$/i.test(fieldValue)) {
					popupField += (fieldValue != null ? '<video controls><source src="images/' + fieldValue.replace(/[\\\/:]/g, '_').trim() + '" type="video/mp4">Il tuo browser non supporta il tag video.</video></td>' : '');
				} else {
					popupField += (fieldValue != null ? autolinker.link(fieldValue.toLocaleString()) + '</td>' : '');
				}
			}
            popupText += '<tr>' + popupField + '</tr>';
        }
    }
    return popupText;
}

var highlight;
var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});

function onPointerMove(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var clusteredFeatures;
    var clusterLength;
    var popupText = '<ul>';
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") == undefined)) {
            var doPopup = false;
            for (k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] != "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            currentLayer = layer;
            clusteredFeatures = feature.get("features");
            if (clusteredFeatures) {
				clusterLength = clusteredFeatures.length;
			}
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n=0; n<clusteredFeatures.length; n++) {
                        currentFeature = clusteredFeatures[n];
                        currentFeatureKeys = currentFeature.getKeys();
                        popupText += '<li><table>'
                        popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                        popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    popupText += '<a>' + '<b>' + layer.get('popuplayertitle') + '</b>' + '</a>';
                    popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                    popupText += '</table></li>';
                }
            }
        }
    });
    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
    
	if (doHighlight) {
        if (currentFeature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (currentFeature) {
                var featureStyle
                if (typeof clusteredFeatures == "undefined") {
					var style = currentLayer.getStyle();
					var styleFunction = typeof style === 'function' ? style : function() { return style; };
					featureStyle = styleFunction(currentFeature)[0];
				} else {
					featureStyle = currentLayer.getStyle().toString();
				}

                if (currentFeature.getGeometry().getType() == 'Point' || currentFeature.getGeometry().getType() == 'MultiPoint') {
                    var radius
					if (typeof clusteredFeatures == "undefined") {
						radius = featureStyle.getImage().getRadius();
					} else {
						radius = parseFloat(featureStyle.split('radius')[1].split(' ')[1]) + clusterLength;
					}

                    highlightStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: "#ffff00"
                            }),
                            radius: radius
                        })
                    })
                } else if (currentFeature.getGeometry().getType() == 'LineString' || currentFeature.getGeometry().getType() == 'MultiLineString') {

                    var featureWidth = featureStyle.getStroke().getWidth();

                    highlightStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffff00',
                            lineDash: null,
                            width: featureWidth
                        })
                    });

                } else {
                    highlightStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: '#ffff00'
                        })
                    })
                }
                featureOverlay.getSource().addFeature(currentFeature);
                featureOverlay.setStyle(highlightStyle);
            }
            highlight = currentFeature;
        }
    }

    if (doHover) {
        if (popupText) {
			content.innerHTML = popupText;
            container.style.display = 'block';
            overlayPopup.setPosition(coord);
        } else {
            container.style.display = 'none';
            closer.blur();
        }
    }
};

map.on('pointermove', onPointerMove);

var popupContent = '';
var popupCoord = null;
var featuresPopupActive = false;

function updatePopup() {
    if (popupContent) {
        content.innerHTML = popupContent;
        container.style.display = 'block';
		overlayPopup.setPosition(popupCoord);
    } else {
        container.style.display = 'none';
        closer.blur();
    }
} 

function onSingleClickFeatures(evt) {
    if (doHover || sketch) {
        return;
    }
    if (!featuresPopupActive) {
        featuresPopupActive = true;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var currentFeature;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (layer && feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") === undefined)) {
            var doPopup = false;
            for (var k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] !== "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            clusteredFeatures = feature.get("features");
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n = 0; n < clusteredFeatures.length; n++) {
                        currentFeature = clusteredFeatures[n];
                        currentFeatureKeys = currentFeature.getKeys();
                        popupText += '<li><table>';
                        popupText += '<a><b>' + layer.get('popuplayertitle') + '</b></a>';
                        popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    popupText += '<a><b>' + layer.get('popuplayertitle') + '</b></a>';
                    popupText += createPopupField(currentFeature, currentFeatureKeys, layer);
                    popupText += '</table>';
                }
            }
        }
    });
    if (popupText === '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
	
	popupContent = popupText;
    popupCoord = coord;
    updatePopup();
}

function onSingleClickWMS(evt) {
    if (doHover || sketch) {
        return;
    }
    if (!featuresPopupActive) {
        popupContent = '';
    }
    var coord = evt.coordinate;
    var viewProjection = map.getView().getProjection();
    var viewResolution = map.getView().getResolution();

    for (var i = 0; i < wms_layers.length; i++) {
        if (wms_layers[i][1] && wms_layers[i][0].getVisible()) {
            var url = wms_layers[i][0].getSource().getFeatureInfoUrl(
                evt.coordinate, viewResolution, viewProjection, {
                    'INFO_FORMAT': 'text/html',
                });
            if (url) {
                const wmsTitle = wms_layers[i][0].get('popuplayertitle');
                var ldsRoller = '<div id="lds-roller"><img class="lds-roller-img" style="height: 25px; width: 25px;"></img></div>';

                popupCoord = coord;
                popupContent += ldsRoller;
                updatePopup();

                var timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Timeout exceeded'));
                    }, 5000); // (5 second)
                });

                // Function to try fetch with different option
                function tryFetch(urls) {
                    if (urls.length === 0) {
                        return Promise.reject(new Error('All fetch attempts failed'));
                    }
                    return fetch(urls[0])
                        .then((response) => {
                            if (response.ok) {
                                return response.text();
                            } else {
                                throw new Error('Fetch failed');
                            }
                        })
                        .catch(() => tryFetch(urls.slice(1))); // Try next URL
                }

                // List of URLs to try
                // The first URL is the original, the second is the encoded version, and the third is the proxy
                const urlsToTry = [
                    url,
                    encodeURIComponent(url),
                    'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
                ];

                Promise.race([tryFetch(urlsToTry), timeoutPromise])
                    .then((html) => {
                        if (html.indexOf('<table') !== -1) {
                            popupContent += '<a><b>' + wmsTitle + '</b></a>';
                            popupContent += html + '<p></p>';
                            updatePopup();
                        }
                    })
                    .finally(() => {
                        setTimeout(() => {
                            var loaderIcon = document.querySelector('#lds-roller');
                            if (loaderIcon) loaderIcon.remove();
                        }, 500); // (0.5 second)
                    });
            }
        }
    }
}

map.on('singleclick', onSingleClickFeatures);
map.on('singleclick', onSingleClickWMS);

//get container
var topLeftContainerDiv = document.getElementById('top-left-container')
var bottomLeftContainerDiv = document.getElementById('bottom-left-container')
var bottomRightContainerDiv = document.getElementById('bottom-right-container')

//==================== TITLE FONDO ====================
//title
//var Title = new ol.control.Control({
 //   element: (() => {
  //      var titleElement = document.createElement('div');
    //    titleElement.className = 'top-left-title ol-control';
      //  titleElement.innerHTML = '<h2 class="project-title">Mapa de Capacidad de Alojamiento para Generación Distribuida</h2>';
        //return titleElement;
    //})(),
    // target: 'top-left-container'
//});
//map.addControl(Title)
//==================== TITLE FONDO EJEMPLO====================
var Title = new ol.control.Control({
    element: (() => {
        var titleElement = document.createElement('div');
        titleElement.className = 'top-left-title ol-control';

        // Agregamos logo + título
        titleElement.innerHTML = `
            <div class="titleRibbon">
                <h2 class="project-title">Mapa de Capacidad de Alojamiento para Generación Distribuida </h2>
            </div>
        `;
        return titleElement;
    })(),
    target: 'top-left-container'
});
map.addControl(Title);


//==================== TITLE FONDO FIN====================
//abstract


//geolocate

isTracking = false;
var geolocateControl = (function (Control) {
    geolocateControl = function(opt_options) {
        var options = opt_options || {};
        
        // Crear botón con emoji 📍
        var button = document.createElement('button');
        button.title = "Ir a mi ubicación";
        button.id = "geolocate-btn";
        button.innerHTML = "🎯"; // <-- Emoji aquí

        // Estilos del botón (similar al geocoder)
        button.style.backgroundColor = "#1976d2";
        button.style.color = "white";
        button.style.fontSize = "18px";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.width = "32px";
        button.style.height = "32px";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.cursor = "pointer";
        button.style.padding = "0";
        button.style.lineHeight = "1";

        var handleGeolocate = function() {
            if (isTracking) {
                map.removeLayer(geolocateOverlay);
                isTracking = false;
          } else if (geolocation.getTracking()) {
                map.addLayer(geolocateOverlay);
                map.getView().setCenter(geolocation.getPosition());
                isTracking = true;
          }
        };
        button.addEventListener('click', handleGeolocate, false);
        button.addEventListener('touchstart', handleGeolocate, false);
        var element = document.createElement('div');
        element.className = 'geolocate ol-unselectable ol-control';
        element.appendChild(button);
        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    };
    if (Control) geolocateControl.__proto__ = Control;
    geolocateControl.prototype = Object.create(Control && Control.prototype);
    geolocateControl.prototype.constructor = geolocateControl;
    return geolocateControl;
}(ol.control.Control));
map.addControl(new geolocateControl())

      var geolocation = new ol.Geolocation({
  projection: map.getView().getProjection()
});


var accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
      new ol.geom.Point(coordinates) : null);
});

var geolocateOverlay = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [accuracyFeature, positionFeature]
  })
});

geolocation.setTracking(true);


//measurement

var measuring = false;
var measureControl = (function (Control) {
    measureControl = function(opt_options) {

      var options = opt_options || {};

       var measurebutton = document.createElement('button');
        measurebutton.title = "Medir distancias";  
        measurebutton.id = "measure-btn";
        measurebutton.innerHTML = "📏";  

        // Estilos del botón
        measurebutton.style.backgroundColor = "#1976d2";  // azul Google style
        measurebutton.style.color = "white";
        measurebutton.style.fontSize = "18px";
        measurebutton.style.border = "none";
        measurebutton.style.borderRadius = "6px";
        measurebutton.style.width = "32px";
        measurebutton.style.height = "32px";
        measurebutton.style.display = "flex";
        measurebutton.style.alignItems = "center";
        measurebutton.style.justifyContent = "center";
        measurebutton.style.cursor = "pointer";
        measurebutton.style.padding = "0";
        measurebutton.style.lineHeight = "1";
      

      var this_ = this;
      var handleMeasure = function(e) {
        if (!measuring) {
            selectLabel.style.display = "";
            this_.getMap().addInteraction(draw);
            createHelpTooltip();
            createMeasureTooltip();
            measuring = true;
        } else {
            selectLabel.style.display = "none";
            this_.getMap().removeInteraction(draw);
            measuring = false;
            this_.getMap().removeOverlay(helpTooltip);
            this_.getMap().removeOverlay(measureTooltip);
            var staticTooltip = document.getElementsByClassName("tooltip-static");
                while (staticTooltip.length > 0) {
                  staticTooltip[0].parentNode.removeChild(staticTooltip[0]);
                }
            measureLayer.getSource().clear();
            sketch = null;
        }
      };

      measurebutton.addEventListener('click', handleMeasure, false);
      measurebutton.addEventListener('touchstart', handleMeasure, false);

      measurebutton.addEventListener("click", () => {
          measurebutton.classList.toggle("clicked");
        });

      var element = document.createElement('div');
      element.className = 'measure-control ol-unselectable ol-control';
      element.appendChild(measurebutton);

      ol.control.Control.call(this, {
        element: element,
        target: options.target
      });

    };
    if (Control) measureControl.__proto__ = Control;
    measureControl.prototype = Object.create(Control && Control.prototype);
    measureControl.prototype.constructor = measureControl;
    return measureControl;
    }(ol.control.Control));
    map.addControl(new measureControl())

    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        if (measuring) {
            /** @type {string} */
            var helpMsg = 'Click para iniciar dibujo';
            if (sketch) {
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
        }
    });
    

    var measureControl = document.querySelector(".measure-control");

    var selectLabel = document.createElement("label");
    selectLabel.innerHTML = "&nbsp;Medida:&nbsp;";

    var typeSelect = document.createElement("select");
    typeSelect.id = "type";

    var measurementOption = [
        { value: "LineString", description: "Longitud" },
        { value: "Polygon", description: "Area" }
        ];
    measurementOption.forEach(function (option) {
        var optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.text = option.description;
        typeSelect.appendChild(optionElement);
    });

    selectLabel.appendChild(typeSelect);
    measureControl.appendChild(selectLabel);

    selectLabel.style.display = "none";
/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */

/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click para continuar la linea, doble click para finalizar';



/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
var continuePolygonMsg = "1click continue, 2click close";


var typeSelect = document.getElementById("type");
var typeSelectForm = document.getElementById("form_measure");

typeSelect.onchange = function (e) {		  
  map.removeInteraction(draw);
  addInteraction();
  map.addInteraction(draw);		  
};

var measureLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({ 
	color: "rgba(0, 0, 255)", //blu
	lineDash: [10, 10],
	width: 4
  }),
  image: new ol.style.Circle({
	radius: 6,
	stroke: new ol.style.Stroke({
	  color: "rgba(255, 255, 255)", 
	  width: 1
	}),
  })
});

var measureLineStyle2 = new ol.style.Style({	  
	stroke: new ol.style.Stroke({
		color: "rgba(255, 255, 255)", 
		lineDash: [10, 10],
		width: 2
	  }),
  image: new ol.style.Circle({
	radius: 5,
	stroke: new ol.style.Stroke({
	  color: "rgba(0, 0, 255)", 
	  width: 1
	}),
		  fill: new ol.style.Fill({
	  color: "rgba(255, 204, 51, 0.4)", 
	}),
	  })
});

var labelStyle = new ol.style.Style({
  text: new ol.style.Text({
	font: "14px Calibri,sans-serif",
	fill: new ol.style.Fill({
	  color: "rgba(0, 0, 0, 1)"
	}),
	stroke: new ol.style.Stroke({
	  color: "rgba(255, 255, 255, 1)",
	  width: 3
	})
  })
});

var labelStyleCache = [];

var styleFunction = function (feature, type) {
  var styles = [measureLineStyle, measureLineStyle2];
  var geometry = feature.getGeometry();
  var type = geometry.getType();
  var lineString;
  if (!type || type === type) {
	if (type === "Polygon") {
	  lineString = new ol.geom.LineString(geometry.getCoordinates()[0]);
	} else if (type === "LineString") {
	  lineString = geometry;
	}
  }
  if (lineString) {
	var count = 0;
	lineString.forEachSegment(function (a, b) {
	  var segment = new ol.geom.LineString([a, b]);
	  var label = formatLength(segment);
	  if (labelStyleCache.length - 1 < count) {
		labelStyleCache.push(labelStyle.clone());
	  }
	  labelStyleCache[count].setGeometry(segment);
	  labelStyleCache[count].getText().setText(label);
	  styles.push(labelStyleCache[count]);
	  count++;
	});
  }
  return styles;
};
var source = new ol.source.Vector();

var measureLayer = new ol.layer.Vector({
  source: source,
  displayInLayerSwitcher: false,
  style: function (feature) {
	labelStyleCache = [];
	return styleFunction(feature);
  }
});

map.addLayer(measureLayer);

var draw; // global so we can remove it later
function addInteraction() {
  var type = typeSelect.value;
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (type),
	style: function (feature) {
			  return styleFunction(feature, type);
			}
  });

  var listener;
  draw.on('drawstart',
      function(evt) {
        // set sketch
        sketch = evt.feature;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
          var geom = evt.target;
          var output;
          if (geom instanceof ol.geom.Polygon) {
				  output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
				  tooltipCoord = geom.getInteriorPoint().getCoordinates();
				} else if (geom instanceof ol.geom.LineString) {
				  output = formatLength(/** @type {ol.geom.LineString} */ (geom));
				  tooltipCoord = geom.getLastCoordinate();
				}
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

  draw.on('drawend',
      function(evt) {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip();
        ol.Observable.unByKey(listener);
      }, this);
}


/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'tooltip hidden';
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'tooltip tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  map.addOverlay(measureTooltip);
}



/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function(line) {
  var length;
  var coordinates = line.getCoordinates();
  length = 0;
  var sourceProj = map.getView().getProjection();
  for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
      var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
      length += ol.sphere.getDistance(c1, c2);
    }
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};

/**
 * Format area output.
 * @param {ol.geom.Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
var formatArea = function (polygon) {
  var area = polygon.getArea();
  var output;
  if (area > 1000000) {
	output =
	  Math.round((area / 1000000) * 1000) / 1000 + " " + "km<sup>2</sup>";
  } else {
	output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
  }
  return output;
};

addInteraction();

var parentElement = document.querySelector(".measure-control");
var elementToMove = document.getElementById("form_measure");
if (elementToMove && parentElement) {
  parentElement.insertBefore(elementToMove, parentElement.firstChild);
}

//geocoder
// ==================== Geocoder (Nominatim) ====================

// Vector para marcar la dirección seleccionada
var vectorLayer = new ol.layer.Vector({
    source: new ol.source.Vector()
});
map.addLayer(vectorLayer);
var vectorSource = vectorLayer.getSource();

// Objeto para almacenar coordenadas
var obj2 = {
    value: '',
    letMeKnow() { console.log(`Posición geocodada ${this.gcd}`); },
    get gcd() { return this.value; },
    set gcd(value) { this.value = value; this.letMeKnow(); }
};

var obj = {
    value: '',
    get label() { return this.value; },
    set label(value) { this.value = value; }
};

// Función al seleccionar dirección
function onSelected(feature) {
    obj.label = feature;
    input.value = typeof obj.label.properties.label === "undefined" 
                  ? obj.label.properties.display_name 
                  : obj.label.properties.label;

    var coordinates = ol.proj.transform(
        [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
        "EPSG:4326",
        map.getView().getProjection()
    );

    vectorSource.clear(true);
    obj2.gcd = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];

    var marker = new ol.Feature(new ol.geom.Point(coordinates));
    var zIndex = 1;
    marker.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 36],
            height:10,
            width:10,
            anchorXUnits: "fraction",
            anchorYUnits: "pixels",
            opacity: 1,
            src: "./resources/ic_location_on_128_28437.png",
            zIndex: zIndex
        }),
        zIndex: zIndex
    }));

    last.style.display = "none"; // oculta barra al seleccionar
    vectorSource.addFeature(marker);
    map.getView().setCenter(coordinates);
    map.getView().setZoom(18);
}

// Formato de resultados
var formatResult = function (feature, el) {
    var title = document.createElement("strong");
    el.appendChild(title);
    var detailsContainer = document.createElement("small");
    el.appendChild(detailsContainer);
    var details = [];
    title.innerHTML = feature.properties.label || feature.properties.display_name;
    if (feature.properties.city && feature.properties.city !== feature.properties.name) {
        details.push(feature.properties.city);
    }
    if (feature.properties.context) {
        details.push(feature.properties.context);
    }
    detailsContainer.innerHTML = details.join(", ");
};

// Clase para añadir control DOM
class AddDomControl extends ol.control.Control {
    constructor(elementToAdd, opt_options) {
        const options = opt_options || {};
        const element = document.createElement("div");
        if (options.className) element.className = options.className;
        element.appendChild(elementToAdd);
        super({ element: element, target: options.target });
    }
}

// Función para manejar resultados (debug)
function myHandler(featureCollection) { console.log(featureCollection); }

// ==================== Configuración API ====================
const url = {
    "Nominatim": "https://nominatim.openstreetmap.org/search?format=geojson&addressdetails=1&",
    "BAN": "https://api-adresse.data.gouv.fr/search/?"
};
var API_URL = url["Nominatim"];

// Crear componente de búsqueda por dirección
var containers = new Photon.Search({
    resultsHandler: myHandler,
    onSelected: onSelected,
    placeholder: "Buscar una dirección",
    formatResult: formatResult,
    url: API_URL,
    position: "topright"
});

// Agregar control al mapa
var left = document.getElementById("top-left-container");
var controlGeocoder = new AddDomControl(containers, {
    className: "photon-geocoder-autocomplete ol-unselectable ol-control",
});
map.addControl(controlGeocoder);

var search = document.getElementsByClassName("photon-geocoder-autocomplete ol-unselectable ol-control")[0];
search.style.display = "flex";

// Crear botón de activación (🔍 azul con emoji)
var button = document.createElement("button");
button.title = "Buscar sitio";
button.type = "button";
button.id = "gcd-button-control";

// IMPORTANTE: sin clases de Font Awesome
button.className = "gcd-gl-btn leaflet-control";

// Emoji como ícono
button.innerHTML = "🔍";

// Estilos del botón
button.style.backgroundColor = "#1976d2";
button.style.color = "white";
button.style.fontSize = "18px";
button.style.border = "none";
button.style.borderRadius = "4px";
button.style.width = "32px";
button.style.height = "32px";
button.style.display = "flex";
button.style.alignItems = "center";
button.style.justifyContent = "center";
button.style.cursor = "pointer";
button.style.padding = "0";
button.style.lineHeight = "1"; // asegura que el emoji quede centrado

// Insertar al inicio del contenedor
search.insertBefore(button, search.firstChild);

var last = search.lastChild;
last.style.display = "none"; // oculto por defecto

// ==================== Botón Cerrar (X) dentro del panel ====================
var closeBtn = document.createElement("button");
closeBtn.innerHTML = "✖";
closeBtn.title = "Cerrar búsqueda";
closeBtn.className = "gcd-gl-btn"; 
closeBtn.style.position = "absolute";
closeBtn.style.top = "6px";
closeBtn.style.right = "6px";
closeBtn.style.border = "none";
closeBtn.style.background = "transparent";
closeBtn.style.fontSize = "16px";
closeBtn.style.cursor = "pointer";
closeBtn.style.color = "#333";

// Acción del botón cerrar
closeBtn.addEventListener("click", function () {
    last.style.display = "none";   // Ocultar barra de búsqueda
    vectorSource.clear();          // Quitar marcador del mapa
    input.value = "";              // Limpiar input
});

// Insertar el botón dentro del panel
last.appendChild(closeBtn);

// Alternar visibilidad del panel
button.addEventListener("click", function () {
    last.style.display = (last.style.display === "none") ? "block" : "none";
});

// ==================== Estilos del panel ====================
var input = document.getElementsByClassName("photon-input")[0];
var searchbar = document.getElementsByClassName("photon-geocoder-autocomplete ol-unselectable ol-control")[0];

last.style.position = "absolute";
last.style.left = "40px";   // al lado del botón azul
last.style.top = "0px";
last.style.backgroundColor = "#fff";
last.style.border = "1px solid #ccc";
last.style.borderRadius = "4px";
last.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
last.style.padding = "30px 10px 10px 10px"; // deja espacio arriba para la X
last.style.flexDirection = "column";
last.style.zIndex = "1000";
last.style.minWidth = "260px";

// Ajuste al input
input.style.border = "1px solid #ccc";
input.style.borderRadius = "3px";
input.style.padding = "6px";
input.style.width = "calc(100% - 28px)";
input.style.marginRight = "4px";
input.style.outline = "none";

// Añadir el searchbar al contenedor izquierdo
left.appendChild(searchbar);



//layer search
//var searchLayer = new SearchLayer({
    //layer: lyr_MedidoresF_2,
    //colName: 'MEDIDOR',
    //zoom: 10,
    //collapsed: true,
    //map: map
//});
//map.addControl(searchLayer);
//document.getElementsByClassName('search-layer')[0].getElementsByTagName('button')[0].className += ' fa fa-binoculars';
//document.getElementsByClassName('search-layer-input-search')[0].placeholder = 'Search feature ...';
// Layer search

// Layer search con activación y resaltado
// ============================
// Search Layer Medidores
// ============================
// ============================
// Search Layer Medidores
// ============================
/*
var highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.5)' }),
            stroke: new ol.style.Stroke({ color: 'red', width: 2 })
        })
    })
});
map.addLayer(highlightLayer);

// Control de búsqueda
var searchLayer = new SearchLayer({
    layer: lyr_MedidoresF_2,
    colName: 'MEDIDOR',
    zoom: 18,
    collapsed: true,
    map: map,
    searchOnType: false,  // evita que busque mientras se escribe
    onSelect: function(selectedFeature) {
        highlightLayer.getSource().clear();
        var cloneFeature = selectedFeature.clone();
        highlightLayer.getSource().addFeature(cloneFeature);

        var geometry = cloneFeature.getGeometry();
        if (geometry) {
            var view = map.getView();
            var extent = geometry.getExtent();
            var buffer = ol.extent.buffer(extent, 20);
            view.fit(buffer, { maxZoom: 18, duration: 700 });
        }

        alert('Seleccionaste el medidor: ' + selectedFeature.get('MEDIDOR'));
    }
});

map.addControl(searchLayer);

var searchButton = document.getElementsByClassName('search-layer')[0]
                    .getElementsByTagName('button')[0];
searchButton.className += ' fa fa-binoculars';
searchButton.title = "Buscar Medidor";

var searchInput = document.getElementsByClassName('search-layer-input-search')[0];
searchInput.placeholder = 'ingrese medidor...';

// Variable temporal
var tempMedidorValue = "";

// Guardamos lo que escribe el usuario, sin buscar
searchInput.addEventListener('input', function(e) {
    tempMedidorValue = e.target.value;
});

// Ejecutar búsqueda solo al presionar Enter
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchInput.value = tempMedidorValue;
        // Llamamos a la función de búsqueda de SearchLayer
        searchLayer.search(tempMedidorValue);
    }
});
*/
//==============================================================================
// ============================
// Búsqueda Medidores personalizada
// ============================
// ==================== Capa de resaltado ====================
var highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function (feature) {
        return new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.5)' }),
                stroke: new ol.style.Stroke({ color: 'red', width: 2 })
            }),
            text: new ol.style.Text({
                text: feature.get('label') || '',
                font: 'bold 14px Arial',
                fill: new ol.style.Fill({ color: '#000' }),
                stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
                offsetY: -15
            })
        });
    }
});
map.addLayer(highlightLayer);

// ==================== Contenedor principal (OL control) ====================
var searchContainer = document.createElement('div');
searchContainer.className = 'ol-control ol-unselectable';
searchContainer.style.display = 'flex';
searchContainer.style.flexDirection = 'column';
searchContainer.style.gap = '5px';
searchContainer.style.position = 'absolute';
searchContainer.style.top = '275px'; // debajo de otros botones OL
searchContainer.style.left = '0.5em';
searchContainer.style.background = 'white';
searchContainer.style.padding = '5px';
searchContainer.style.border = '1px solid #666';
searchContainer.style.borderRadius = '5px';
searchContainer.style.zIndex = 1000;

// ==================== Botón principal ====================
var toggleButton = document.createElement('button');
toggleButton.innerHTML = '⚡';
toggleButton.title = 'Buscar Medidor';
toggleButton.style.width = '100%';
toggleButton.style.cursor = 'pointer';
toggleButton.style.fontSize = '20px';
toggleButton.style.borderRadius = '5px';
toggleButton.style.border = '1px solid #666';
toggleButton.style.background = 'white';
searchContainer.appendChild(toggleButton);

// ==================== Panel interno ====================
var inputPanel = document.createElement('div');
inputPanel.style.display = 'none';
inputPanel.style.flexDirection = 'row';
inputPanel.style.gap = '5px';
inputPanel.style.alignItems = 'center';

// Input
var inputMedidor = document.createElement('input');
inputMedidor.type = 'text';
inputMedidor.placeholder = 'Ingrese medidor...';
inputMedidor.style.flex = '1';

// Botón aplicar
var applyButton = document.createElement('button');
applyButton.innerHTML = 'Buscar';
applyButton.style.cursor = 'pointer';
applyButton.style.width = '70px';

// Botón cerrar
var closeButton = document.createElement('button');
closeButton.innerHTML = '&times;';
closeButton.title = 'Cerrar búsqueda';
closeButton.style.cursor = 'pointer';
closeButton.style.background = '#f0f0f0';
closeButton.style.color = '#333';
closeButton.style.border = '1px solid #ccc';
closeButton.style.borderRadius = '50%';
closeButton.style.width = '25px';
closeButton.style.height = '25px';
closeButton.style.fontWeight = 'bold';
closeButton.style.display = 'flex';
closeButton.style.alignItems = 'center';
closeButton.style.justifyContent = 'center';
closeButton.style.transition = '0.2s';

// Efectos hover
closeButton.addEventListener('mouseenter', function() {
    closeButton.style.background = '#e0e0e0';
    closeButton.style.color = '#000';
    closeButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
});
closeButton.addEventListener('mouseleave', function() {
    closeButton.style.background = '#f0f0f0';
    closeButton.style.color = '#333';
    closeButton.style.boxShadow = 'none';
});

// Agregar elementos al panel
inputPanel.appendChild(inputMedidor);
inputPanel.appendChild(applyButton);
inputPanel.appendChild(closeButton);
searchContainer.appendChild(inputPanel);

// Agregar control al mapa
var customSearchControl = new ol.control.Control({ element: searchContainer });
map.addControl(customSearchControl);

// Mostrar/ocultar input
toggleButton.addEventListener('click', function() {
    inputPanel.style.display = (inputPanel.style.display === 'none') ? 'flex' : 'none';
});

// ==================== Función de búsqueda ====================
function buscarMedidor() {
    var valor = (inputMedidor.value || '').trim();
    if (!valor) return;

    // Limpiar resaltados anteriores
    var hlSource = highlightLayer.getSource();
    hlSource.clear();

    // Obtener features de la capa de medidores
    var src = lyr_MedidoresF_2.getSource();
    var feats = src.getFeatures();

    // Si aún no cargaron, esperar y reintentar
    if (!feats || feats.length === 0) {
        src.once('change', function () { buscarMedidor(); });
        return;
    }

    // Búsqueda tolerante a mayúsculas/espacios
    var buscado = valor.toUpperCase();
    var encontrado = feats.find(function (f) {
        var v = String(f.get('MEDIDOR') ?? '').trim().toUpperCase();
        return v === buscado;
    });

    if (!encontrado) {
        alert('Medidor no encontrado: ' + valor);
        return;
    }

    // Clonar y etiquetar
    var cloneFeature = encontrado.clone();
    cloneFeature.set('label', String(encontrado.get('MEDIDOR') || valor));

    // Agregar al resaltado
    hlSource.addFeature(cloneFeature);

    // Zoom al elemento
    var geometry = cloneFeature.getGeometry();
    if (geometry) {
        var view = map.getView();
        if (geometry instanceof ol.geom.Point) {
            view.animate({
                center: geometry.getCoordinates(),
                zoom: Math.min(view.getMaxZoom() || 18, 18),
                duration: 700
            });
        } else {
            var padded = ol.extent.buffer(geometry.getExtent(), 50);
            view.fit(padded, { maxZoom: 18, duration: 700, padding: [40, 40, 40, 40] });
        }
    }
}

// Ejecutar búsqueda
applyButton.addEventListener('click', buscarMedidor);
inputMedidor.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        buscarMedidor();
    }
});

// Botón cerrar
closeButton.addEventListener('click', function() {
    inputPanel.style.display = 'none';       // Oculta el panel
    highlightLayer.getSource().clear();      // Limpia el resaltado
    inputMedidor.value = "";                 // Limpia el input
});



















// ============================ Búsqueda Medidores personalizada =========== FIN


//scalebar
// ==================== Barra de Escala ====================
// ==================== Contenedor unificado: Escala, Rosa de los Vientos y Ayuda ====================

// ==================== Escala ====================
var scaleLineControl = new ol.control.ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true
});
map.addControl(scaleLineControl); // agregamos desde el inicio

var scaleLineElement = scaleLineControl.element;
// Posición en la esquina inferior derecha
scaleLineElement.style.bottom = "10px";
scaleLineElement.style.left = "60px";
scaleLineElement.style.position = "absolute"; // asegurar que funcione
scaleLineElement.style.zIndex = "1000"; // opcional, para que quede arriba de otros elementos

// Oculta al inicio
scaleLineElement.style.display = "block";  
var scaleVisible = true;  // estado inicial coincide con lo visual


var buttonWidth = "30px";
var buttonHeight = "30px";

// ==================== Botón Escala ====================
var toggleScaleButton = document.createElement("button");
toggleScaleButton.innerHTML = "📐";  // escuadra, medición geométrica
toggleScaleButton.title = "Mostrar/Ocultar Escala";
toggleScaleButton.style.fontSize = "20px";
toggleScaleButton.style.width = buttonWidth;
toggleScaleButton.style.height = buttonHeight;
toggleScaleButton.style.cursor = "pointer";
toggleScaleButton.style.border = "1px solid #666";
toggleScaleButton.style.borderRadius = "5px";
toggleScaleButton.style.background = "white";

toggleScaleButton.addEventListener("click", function () {
    if (scaleVisible) {
        scaleLineElement.style.display = "none";
        toggleScaleButton.style.background = "white";
    } else {
        scaleLineElement.style.display = "block";
        toggleScaleButton.style.background = "#cfc";
    }
    scaleVisible = !scaleVisible; // 🔄 ahora sí sincronizado
});
// ==================== Rosa de los Vientos ====================
var rosaContainer = document.createElement("div");
rosaContainer.id = "rosaContainer";
rosaContainer.style.display = "none"; // inicia oculto
rosaContainer.style.position = "absolute";  // 🔹 Posición absoluta dentro del mapa
rosaContainer.style.bottom = "60px";
rosaContainer.style.left = "50px";
rosaContainer.style.zIndex = "1000";



var rosaImg = document.createElement("img");
rosaImg.src = "https://raw.githubusercontent.com/ingalexvarela/Mapa15_CAR/main/images/rosaT.png";
rosaImg.style.width = "140px";
rosaImg.style.height = "auto";
rosaImg.style.opacity = "0.9";
rosaContainer.appendChild(rosaImg);
//document.body.appendChild(rosaContainer);
// lo agregamos dentro del contenedor del mapa
document.getElementById("map").appendChild(rosaContainer);

// Botón Rosa de los Vientos
var rosaButton = document.createElement("button");
rosaButton.innerHTML = "🧭";
rosaButton.title = "Mostrar/Ocultar Rosa de los Vientos";
rosaButton.style.fontSize = "20px";
rosaButton.style.width = buttonWidth;
rosaButton.style.height = buttonHeight;
rosaButton.style.cursor = "pointer";
rosaButton.style.border = "1px solid #666";
rosaButton.style.borderRadius = "5px";
rosaButton.style.background = "white";
rosaButton.addEventListener("click", function() {
    rosaContainer.style.display = (rosaContainer.style.display === "none") ? "block" : "none";
});

// ==================== Ayuda ====================
var ayudaButton = document.createElement("button");
ayudaButton.innerHTML = "❓";
ayudaButton.title = "Abrir página de ayuda";
ayudaButton.style.fontSize = "20px";
ayudaButton.style.width = buttonWidth;
ayudaButton.style.height = buttonHeight;
ayudaButton.style.cursor = "pointer";
ayudaButton.style.border = "1px solid #666";
ayudaButton.style.borderRadius = "5px";
ayudaButton.style.background = "white";
ayudaButton.addEventListener("click", function() {
    window.open("https://ingalexvarela.github.io/Mapa15_CAR/images/README.html", "_blank");
});

// ==================== Contenedor de los tres botones ====================
var controlContainer = document.createElement("div");
controlContainer.className = "ol-control ol-unselectable";
controlContainer.style.display = "flex";
controlContainer.style.flexDirection = "column";
controlContainer.style.gap = "5px";
//controlContainer.style.position = "absolute";
//controlContainer.style.bottom = "10px";
//controlContainer.style.left = "10px";
controlContainer.style.position = "absolute";
controlContainer.style.top = "390px";  // Ajusta según la posición final del último botón de QGIS2Web
controlContainer.style.left = "0.52em"; // mismo left que los demás botones
controlContainer.appendChild(toggleScaleButton);
controlContainer.appendChild(rosaButton);
controlContainer.appendChild(ayudaButton);

// Crear control OL y agregar al mapa
var unifiedControl = new ol.control.Control({ element: controlContainer });
map.addControl(unifiedControl);

// ==================== Layer Switcher ====================
//layerswitcher

// ==================== Layer Switcher ====================
var layerSwitcher = new ol.control.LayerSwitcher({
    tipLabel: "Layers", // este es el tooltip
    target: 'top-right-container'
});
map.addControl(layerSwitcher);


// ==================== Atributos de la parte inferior derecha ====================
// ==================== Control de Atribución ====================
var attributionControl = new ol.control.Attribution({
    collapsible: false,
    collapsed: false
});
map.addControl(attributionControl);

// Esperamos a que el control se renderice
setTimeout(function() {
    // Seleccionamos el div real de la atribución dentro del mapa
    var attributionDiv = document.querySelector('#map .ol-attribution');

    // Limpiamos el contenido actual y agregamos los créditos deseados
    var attributionUl = attributionDiv.querySelector('ul');
    attributionUl.innerHTML = "";

    // Departamento de Ingeniería Eléctrica
    var deptAttribution = document.createElement('li');
    deptAttribution.innerHTML = `<b>COOPEALFARORUIZ R.L. (CAR)</b>`;
    deptAttribution.style.display = "block"; // 🔹 fuerza que quede en un renglón
    attributionUl.appendChild(deptAttribution);

    // Departamento de Ingeniería Eléctrica
    var deptAttribution = document.createElement('li');
    deptAttribution.innerHTML = `Gestión de Redes Eléctricas: Ing. Alex Varela Quirós`;
    deptAttribution.style.display = "block"; // 🔹 fuerza que quede en un renglón
    attributionUl.appendChild(deptAttribution);

    // Departamento de Ingeniería Eléctrica
    var deptAttribution = document.createElement('li');
    deptAttribution.innerHTML = `Gestión del GIS: Ing. Jefferson Camacho Gomez`;
    deptAttribution.style.display = "block"; // 🔹 fuerza que quede en un renglón
    attributionUl.appendChild(deptAttribution);

    // OpenStreetMap (obligatorio)
    var osmAttribution = document.createElement('li');
    osmAttribution.innerHTML = `<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors. CC-BY-SA</a>`;
    osmAttribution.style.display = "block";
    attributionUl.appendChild(osmAttribution);

    // Opcional: qgis2web/OpenLayers/QGIS
    var toolsAttribution = document.createElement('li');
    
    // Arranca visible
    attributionDiv.style.display = "block";
    var attributionVisible = true;

    // ==================== Botón Créditos ====================
}, 100); // timeout corto para esperar a que el control se agregue



//attribution

//var bottomAttribution = new ol.control.Attribution({
  //collapsible: false,
  //collapsed: false,
  //className: 'bottom-attribution'
//});
//map.addControl(bottomAttribution);

//var attributionList = document.createElement('li');
//attributionList.innerHTML = `
//	<a href="https://github.com/qgis2web/qgis2web">qgis2web</a> &middot;
//	<a href="https://openlayers.org/">OpenLayers</a> &middot;
//	<a href="https://qgis.org/">QGIS</a>	
//`;
//var bottomAttributionUl = bottomAttribution.element.querySelector('ul');
//if (bottomAttributionUl) {
//  bottomAttribution.element.insertBefore(attributionList, bottomAttributionUl);
//}


// Disable "popup on hover" or "highlight on hover" if ol-control mouseover
var preDoHover = doHover;
var preDoHighlight = doHighlight;
var isPopupAllActive = false;
document.addEventListener('DOMContentLoaded', function() {
	if (doHover || doHighlight) {
		var controlElements = document.getElementsByClassName('ol-control');
		for (var i = 0; i < controlElements.length; i++) {
			controlElements[i].addEventListener('mouseover', function() { 
				doHover = false;
				doHighlight = false;
			});
			controlElements[i].addEventListener('mouseout', function() {
				doHover = preDoHover;
				if (isPopupAllActive) { return }
				doHighlight = preDoHighlight;
			});
		}
	}
});


//move controls inside containers, in order
    //zoom
    var zoomControl = document.getElementsByClassName('ol-zoom')[0];
    if (zoomControl) {
        topLeftContainerDiv.appendChild(zoomControl);
    }
    //geolocate
    var geolocateControl = document.getElementsByClassName('geolocate')[0];
    if (geolocateControl) {
        topLeftContainerDiv.appendChild(geolocateControl);
    }
    //measure
    var measureControl = document.getElementsByClassName('measure-control')[0];
    if (measureControl) {
        topLeftContainerDiv.appendChild(measureControl);
    }
    //geocoder
    var searchbar = document.getElementsByClassName('photon-geocoder-autocomplete ol-unselectable ol-control')[0];
    if (searchbar) {
        topLeftContainerDiv.appendChild(searchbar);
    }
    //search layer
    var searchLayerControl = document.getElementsByClassName('search-layer')[0];
    if (searchLayerControl) {
        topLeftContainerDiv.appendChild(searchLayerControl);
    }
    //scale line
    var scaleLineControl = document.getElementsByClassName('ol-scale-line')[0];
    if (scaleLineControl) {
        scaleLineControl.className += ' ol-control';
        bottomLeftContainerDiv.appendChild(scaleLineControl);
    }
    //attribution
    var attributionControl = document.getElementsByClassName('bottom-attribution')[0];
    if (attributionControl) {
        bottomRightContainerDiv.appendChild(attributionControl);
    }
