
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

// Layer Styles
var wellSitesStyle = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// Map Features
var wellPoints;
var censusTracts;
var nitrateLevels;

// Map Layers
var wellLayer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, wellSitesStyle);
    }
}).addTo(map);
var censusLayer = L.geoJSON(null, {style:styleTracts}).addTo(map);
var countiesLayer = L.geoJSON().addTo(map);
var nitrateLayer = L.geoJSON(null, {style:styleInterpolation});
// var cancerRates = L.geoJSON(null, {style:styleCancer});


// HTML Elements
var exponentInput = document.getElementById("exponent");
var cellSizeInput = document.getElementById("cellSize");
var interpolateButton = document.getElementById("interpolate");
var removeInterpolateButton = document.getElementById("removeInterpolate");
var cancerRateButton = document.getElementById("cancerRate");
var removeCancerButton = document.getElementById("removeCancer");
var loader = document.getElementById("loader");

loader.hidden = true;

// User Editable Variables
var exponent = 1;
var cellSize = 5;


// END DEFINE GLOBAL VARIABLES
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// BUILD MAP
// add the mapbox tiles to the map object
map.addLayer(mapboxTiles);


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


// ADD EVENT LISTENERS
// --------------------------------------------------------------------------
exponentInput.addEventListener("change", function(){
    exponent = Number(exponentInput.value);
});

cellSizeInput.addEventListener("change", function(){
    cellSize = Number(cellSizeInput.value);
});

interpolateButton.addEventListener("click", function(){
    loader.hidden = false;
    $.ajax({
        success:function(){
            createInterpolation(wellPoints);
            nitrateLayer.addTo(map);
            loader.hidden = true;
        }
    });

});

removeInterpolateButton.addEventListener("click",function(){
   map.removeLayer(nitrateLayer);
});

cancerRateButton.addEventListener("click", function(){
    // createCancerLayer(censusTracts);
});

removeCancerButton.addEventListener("click",function(){
    // map.removeLayer(cancerRates);
});

// Log the coordinates of a mouse click
// map.on('click', function(e){
//     var coord = e.latlng;
//     var lat = coord.lat;
//     var lng = coord.lng;
//     console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
// });

// --------------------------------------------------------------------------


// Define Functions
function addCounties(){
    $.ajax("assets/data/WICounties.geojson", {
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
    $.ajax("assets/data/WICensusTracts.geojson", {
        dataType: "json",
        success: createCensusLayer
    });
};

function createCensusLayer(response, status, jqXHRobject){

    censusTracts = response;

    censusLayer.addData(response)
    censusLayer.bringToBack(map);

    cancerRateButton.disabled = false;
};


// Define Functions
function addWellSites(){
    $.ajax("assets/data/WellSites.geojson", {
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

    // Make the interpolation button active
    interpolateButton.disabled = false;

    // createInterpolation(wellPoints);
};


function createInterpolation(wellPoints){
    // map.removeLayer(nitrateLayer);
    nitrateLayer.clearLayers();

    // var options = {gridType: 'hex', property: 'nitr_ran', units: 'miles', weight: exponent};
    // var grid = turf.interpolate(wellPoints, 5, options);

    var options = {gridType: 'hex', property: 'nitr_ran', units: 'miles', weight: exponent};
    nitrateLevels = turf.interpolate(wellPoints, cellSize, options);

    // console.log(grid);

    nitrateLayer.addData(nitrateLevels);

    loader.hidden = true;
    // nitrateLayer.addTo(map);

    // collectPoints(grid);
    // rates.bringToBack(map);
};


function getInterpolationColor(d) {
    return d > 5 ? '#993404' :
            d > 4  ? '#d95f0e' :
                d > 3  ? '#fe9929' :
                    d > 1  ? '#fed98e' :
                        '#ffffd4';
}

function styleInterpolation(feature) {
    return {
        fillColor: getInterpolationColor(feature.properties.nitr_ran),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function getTractsColor(d) {
    return d > .8 ? '#993404' :
            d > .6  ? '#d95f0e' :
                d > .4  ? '#fe9929' :
                    d > .2  ? '#fed98e' :
                        '#ffffd4';
}

function styleTracts(feature) {
    return {
        fillColor: getTractsColor(feature.properties.canrate),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}



function getCancerColor(d) {
    return d > .8 ? '#993404' :
        d > .6  ? '#d95f0e' :
            d > .4  ? '#fe9929' :
                d > .2  ? '#fed98e' :
                    '#ffffd4';
}

function styleCancer(feature) {
    return {
        fillColor: getCancerColor(feature.properties.canrate),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}


function createCancerLayer(censusTracts) {

    testCancerInterpolate(censusTracts);
    // map.removeLayer(cancerRates);
    // cancerRates.clearLayers();
    //
    // var bbox = turf.bbox(wellPoints);
    // console.log(bbox);
    // var cellSide = 10;
    // var options = {units: 'miles', properties:{canrate: 0}};
    // var hexGrid = turf.hexGrid(bbox, cellSide, options);
    //
    // console.log(hexGrid);
    //
    // cancerRates.addData(hexGrid);
    //
    // cancerRates.addTo(map);
};

function collectPoints(grid){
    var collected = turf.collect(censusTracts, grid, 'nitr_ran', 'canrate');
    console.log(collected);
};

function testCancerInterpolate(censusTracts){
    console.log("Test Intersect -----------------------------");

    var tractCentroids = [];
    turf.featureEach(censusTracts, function(currentFeature, featureIndex){
        var centroid = turf.centroid(currentFeature);
        centroid.properties = {canrate:currentFeature.properties.canrate};
        console.log(centroid, centroid.properties.canrate);
        tractCentroids.push(centroid);
    });

    console.log(tractCentroids);

    var tractPoints = turf.featureCollection(tractCentroids);


    var options = {gridType: 'hex', property: 'canrate', units: 'miles', weight: exponent};
    var grid = turf.interpolate(tractPoints, cellSize, options);
    // Interpolate the points to a grid

    console.log(grid);

    var canRates = L.geoJSON(grid, {style:styleCancer});

    canRates.addTo(map);

    console.log("Test Intersect End -------------------------");

};