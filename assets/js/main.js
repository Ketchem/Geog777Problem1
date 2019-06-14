
// --------------------------------------------------------------------------
// DEFINE GLOBAL VARIABLES
// mapbox access token
var accessToken = 'pk.eyJ1Ijoia2V0Y2hlbTIiLCJhIjoiY2pjYzQ5ZmFpMGJnbTM0bW01ZjE5Z2RiaiJ9.phQGyL1FqTJ-UlQuD_UFpg';
//  mapbox tiles
var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + accessToken, {
    attribution: '© <a href="https://www.mapbox.com/feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
// create the map object and set the center and zoom
var map = L.map('map', {
    center: [44.75, -89.65], 
    zoom: 7
});

var wellSitesStyle = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var wellPoints;
// END DEFINE GLOBAL VARIABLES
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// BUILD MAP
// add the mapbox tiles to the map object
map.addLayer(mapboxTiles);



var wellLayer = L.geoJSON(null, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, wellSitesStyle);
        }
    }).addTo(map);
var censusLayer = L.geoJSON().addTo(map);
var countiesLayer = L.geoJSON().addTo(map);


// addLayers(layers);
addWellSites();
addCensusTracts();
addCounties();


var overlayLayers = {
    "Well Sites": wellLayer,
    "Census Tracts" : censusLayer,
    "Counties" : countiesLayer
}
// END BUILD MAP
// --------------------------------------------------------------------------


// ADD LAYER CONTROLS
// --------------------------------------------------------------------------
L.control.layers(null, overlayLayers).addTo(map);

// --------------------------------------------------------------------------

// Define Functions
function addCounties(){
    $.ajax("assets/data/WICounties.topojson", {
        dataType: "json",
        success: createCountyLayer
    });
};

function createCountyLayer(response, status, jqXHRobject){
    countiesLayer.addData(response);
    countiesLayer.bringToBack(map);
};

// Rename all functions and variables
function addCensusTracts(){
    $.ajax("assets/data/WICensusTracts.topojson", {
        dataType: "json",
        success: createCensusLayer
    });
};

function createCensusLayer(response, status, jqXHRobject){

    censusLayer.addData(response)
    censusLayer.bringToBack(map);
};


// Define Functions
function addWellSites(){
    $.ajax("assets/data/WellSites.topojson", {
        dataType: "json",
        success: createWellSitesLayer
    });
};

function createWellSitesLayer(response, status, jqXHRobject){
    wellPoints = response;

    wellLayer.addData(wellPoints, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, wellSitesStyle);
        }
    });
    wellLayer.bringToFront(map);

    createInterpolation(wellPoints);
};


function createInterpolation(wellPoints){
    console.log(wellPoints);

    var exponent = 1;
    var options = {gridType: 'hex', property: 'nitr_ran', units: 'miles', weight: exponent};
    var grid = turf.interpolate(wellPoints, 5, options);

    console.log(grid);

    var rates = L.geoJSON(grid, {style:style});

    rates.addTo(map);
    rates.bringToBack(map);
};


function getColor(d) {
    return d > 5 ? '#993404' :
            d > 4  ? '#d95f0e' :
                d > 3  ? '#fe9929' :
                    d > 1  ? '#fed98e' :
                        '#ffffd4';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.nitr_ran),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}