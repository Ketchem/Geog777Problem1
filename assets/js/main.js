
// --------------------------------------------------------------------------
// DEFINE GLOBAL VARIABLES
// mapbox access token
var accessToken = 'pk.eyJ1Ijoia2V0Y2hlbTIiLCJhIjoiY2pjYzQ5ZmFpMGJnbTM0bW01ZjE5Z2RiaiJ9.phQGyL1FqTJ-UlQuD_UFpg';

//  mapbox tiles
// https://api.mapbox.com/styles/v1/ketchem2/cjxaofh553ssx1cpdh6nkjqo3.html?title=true&access_token=pk.eyJ1Ijoia2V0Y2hlbTIiLCJhIjoiY2pjYzQ5ZmFpMGJnbTM0bW01ZjE5Z2RiaiJ9.phQGyL1FqTJ-UlQuD_UFpg#6.1/44.622012/-89.976147/0
// https://api.mapbox.com/styles/v1/ketchem2/cjxaofh553ssx1cpdh6nkjqo3.html?fresh=true&title=true&access_token=pk.eyJ1Ijoia2V0Y2hlbTIiLCJhIjoiY2pjYzQ5ZmFpMGJnbTM0bW01ZjE5Z2RiaiJ9.phQGyL1FqTJ-UlQuD_UFpg#6.1/44.622012/-89.976147/0
// var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/ketchem2/cjxaofh553ssx1cpdh6nkjqo3.html?access_token=' + accessToken + '#6.1/44.622012/-89.976147/0', {
//     attribution: '<a href="https://www.mapbox.com/feedback/">Mapbox</a> <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// });

var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + accessToken, {
    attribution: '<a href="https://www.mapbox.com/feedback/">Mapbox</a> <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

var countyStyle = {
    fill: false,
    stroke: "#000"
};

// Map Features
var wellPoints;
var censusTracts;
var nitrateLevels;
var errors;

// Map Layers
var wellLayer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, wellSitesStyle);
    }
}).addTo(map);
var censusLayer = L.geoJSON(null, {style:styleTracts}).addTo(map);
var countiesLayer = L.geoJSON(null, {style:countyStyle}).addTo(map);
var nitrateLayer = L.geoJSON(null, {style:styleInterpolation});
var errorLayer = L.geoJSON(null, {style:styleError});
// var cancerRates = L.geoJSON(null, {style:styleCancer});


// HTML Elements
var exponentInput = document.getElementById("exponent");
var cellSizeInput = document.getElementById("cellSize");
var interpolateButton = document.getElementById("interpolate");
var removeInterpolateButton = document.getElementById("removeInterpolate");
var calculateButton = document.getElementById("calculate");
var loader = document.getElementById("loader");
var regressionLoader = document.getElementById("regressionLoader");
var results = document.getElementById("results");
var slopeDisplay = document.getElementById("slope");
var intersectDisplay = document.getElementById("intersect");
var errorLoader = document.getElementById("errorLoader");
var errorButton = document.getElementById("errorButton");


loader.hidden = true;
regressionLoader.hidden = true;
errorLoader.hidden = true;
interpolateButton.disabled = true;
errorButton.disabled = true;

// User Editable Variables
var exponent = 1;
var cellSize = 5;

// Calculated Values
var regressionEq;

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
            calculateButton.disabled = false;
        }
    });
});

removeInterpolateButton.addEventListener("click",function(){
   map.removeLayer(nitrateLayer);
});

calculateButton.addEventListener("click", function(){
    regressionLoader.hidden = false;
    $.ajax({
        success:function(){
            regressionEq = calculateRegression();
            regressionLoader.hidden = true;
            results.hidden = false;
            slopeDisplay.innerText = Number(regressionEq.m).toFixed(2);
            intersectDisplay.innerText = Number(regressionEq.b).toFixed(2);
            errorButton.disabled = false;
        }
    });
});

errorButton.addEventListener("click", function(){
    errorLoader.hidden = false;
    $.ajax({
        success:function(){
            calculateError();
            errorLayer.addTo(map);
            errorLoader.hidden = true;
        }
    });

});
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
};

function styleError(feature){
    return {
        fillColor: getErrorsColor(feature.properties.errorLevel),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
};

function getErrorsColor(d){
    return d > 12 ? '#49006a' :
            d > 9  ? '#ae017e' :
                d > 6  ? '#f768a1' :
                    d > 3  ? '#fcc5c0' :
                        '#fff7f3';
}

function calculateRegression(){
    // console.log("Calculate Regression Started");

    var tractCentroids = [];

    turf.featureEach(censusTracts, function(currentFeature, featureIndex){
        var centroid = turf.centroid(currentFeature);
        centroid.properties = {canrate:currentFeature.properties.canrate};
        tractCentroids.push(centroid);
    });

    var collected = turf.collect(nitrateLevels, turf.featureCollection(tractCentroids), 'canrate', 'canrate');

    var emptyBins = []
    var bins = []
    turf.featureEach(collected, function(currentFeature, featureindex){
        if(currentFeature.properties.canrate.length > 0){
            var sum = 0
            for (var i = 0; i < currentFeature.properties.canrate.length; i++){
                sum += currentFeature.properties.canrate[i];
            }
            var canRate = sum / currentFeature.properties.canrate.length

            // currentFeature.properties.canrate = canRate;
            bins.push([currentFeature.properties.nitr_ran, canRate]);
        }
        else {
            emptyBins.push(currentFeature);
        }
    });

    // console.log(bins);
    console.log(ss.linearRegression(bins));
    // console.log("Calculate Regression Finished");

    return ss.linearRegression(bins);
};


function calculateError(){
    errors = censusTracts;
    var min = 0, max = 0;
    turf.featureEach(errors, function(currentFeature, featureindex) {

        var canRate = Number(currentFeature.properties.canrate);
        var nitrate = Number(currentFeature.properties.nitrate);
        var calcNitrate = Number((regressionEq.m * canRate) + regressionEq.b).toFixed(2)

        var error = calcNitrate - nitrate

        if (error < min) {
            min = error;
        }
        if (error > max){
            max = error;
        }

        currentFeature.properties.errorLevel = Math.abs(error);
    });

    // console.log(min);
    // console.log(max);
    errorLayer.addData(errors);
    console.log(errors);
};