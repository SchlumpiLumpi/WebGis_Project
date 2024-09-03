"use strict"

let wikiData = getWikiData()
//make a map
var map = L.map('map').setView([51, 13], 8)

//Layergroups
const saxonyLayer = L.geoJSON(saxony).addTo(map)
let markerLayerGroup = L.layerGroup()
var drawnFeatures = new L.FeatureGroup() //stores drawn features
var activeFeatures = []
let allMarkerLocationFeatureGroups = [] //stores features like [[feature,label]]



//Baselayers
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var CyclOSM = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
	maxZoom: 20,
	attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})
var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});

var baseMaps = {
    "OSM": osm,
    "OSM.Hot": osmHOT,
    "OSM.Cycle": CyclOSM
}
//here an layerControl is added to the map
var layerControl = L.control.layers(baseMaps).addTo(map);
layerControl.addOverlay(saxonyLayer, "saxony").addTo(map);
//here drawControl is added
var drawControl = new L.Control.Draw({
    draw: {
        polygon: false,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: true
    },
    edit: {
        featureGroup: drawnFeatures,
        remove: true
    }
})
//this control disables drawing, when there is already something drawn
var drawControlfalse = new L.Control.Draw({
    draw: {
        polygon: false,
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: false
    },
    edit: {
        featureGroup: drawnFeatures,
        remove: true
    }
})
map.addControl(drawControl)
map.addLayer(drawnFeatures)

//layerControl.getOverlays(), returns array containing overlay-layers names and whether they are currently drawn or not

//adapted from stackoverflow
L.Control.Layers.include({
    getOverlays: function () {
        // create hash to hold all layers
        var control
        var layers
        var allOverlays = []
        layers = {};
        control = this;

        // loop through all layers in control
        control._layers.forEach(function (obj) {
            var layerName;

            // check if layer is an overlay
            if (obj.overlay) {
                // get name of overlay
                layerName = obj.name;
                // store whether it's present on the map or not
                var active = control._map.hasLayer(obj.layer);
                allOverlays.push([layerName, active])
            }
        });
        //console.log("current Overlays", allOverlays)
        return allOverlays;
    }
})

//draw cities
async function drawCityMarkers(cities, label = "Cities", markerIcon = L.Icon.Default) {
    if (cities == undefined) {
        console.log("there is no valid .json: cant draw markers")
    }
    else {
        var markerArr = []
        console.log("drawing markers....")
        //get data of current temperatures for each place
        const tempData = await mergeWeatherData(cities)
        //auto index
        if (label != "Cities") {
            var i = 1
            allMarkerLocationFeatureGroups.forEach(element => {
                if (element[1] == label) {
                    let labelArr = label.split(".")
                    //console.log("labelArr:", labelArr[0])
                    label = labelArr[0] + "." + i.toString()
                    i++
                    console.log("Label:", label)
                }
            })
        }

        allMarkerLocationFeatureGroups.push([cities, label])
        ///bind popups to marker
        var i = 0 //index for iterating through temperature data
        cities.features.forEach(feature => {
            //console.log("found feature: ", feature)
            let markerPosition = feature.geometry.coordinates
            let distanceDD=distance2DD(markerPosition)
            let cityName = feature.properties['Place name']
            let wikipath = feature.properties['Wikipedia article']
            let temp = tempData[i].temp
            if (wikipath == undefined || wikipath=="") {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b></br>" +
                        "<p>Distance Dresden: " + distanceDD + " °C</p>" +
                        "<p>current temperature: " + temp + " °C</p>"
                    )
            }
            else {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b></br><br>" +
                        "<a href=" + wikipath + " target='_blank'>" + wikipath + "</a><br>" +
                        "<p>Distance Dresden: " + distanceDD + " [km]</p>" +
                        "<p>Temperature: " + temp + " °C</p>"
                    )

            }
            var marker = L.marker([markerPosition[1], markerPosition[0]], { title: cityName }).bindPopup(popup).on('click', showWiki).on('click', weatherForecast)
            markerArr.push(marker)
            i = i + 1
        });
        markerLayerGroup = L.layerGroup(markerArr).addTo(map)
        layerControl.addOverlay(markerLayerGroup, "Cities").addTo(map)
        console.log("add cities layer", markerLayerGroup)
    }
}
//select markers within in draw:rectangle, activeFeature:[Layername, true],polygonFeature is rectangle as geoJSON
function citySelect(activeFeatures, polygonFeature) {
    var selectedCities = L.geoJSON()
    var activeMarkerLoctionFeatureGroups = []
    //get activeFeatureGroups
    activeFeatures.forEach(featuregroup => {
        allMarkerLocationFeatureGroups.forEach(element => {
            //gets [featuregroup,label] from allMarkerLocationsFeatureGroup, if featuregroup is currently active on map
            if (element[1] == featuregroup[0]) {
                activeMarkerLoctionFeatureGroups.push(element[0])
            }
        })
    })

    //only draw markers within boundingbox/rectangle
    activeMarkerLoctionFeatureGroups.forEach(featureGroup => {
        featureGroup.features.forEach(feature => {
            let within = turf.inside(feature, polygonFeature)
            if (within == true) {
                selectedCities.addData(feature)
                //console.log("city within:", feature)
            }
            else {
                //console.log("city discarded:", feature)
            }
        })
    })
    selectedCities = selectedCities.toGeoJSON()
    console.log("selectedCities: ", selectedCities)
    return selectedCities //geoJSON-feature
}



/*+++++++++++++++++++++++++++
        Events
++++++++++++++++++++++++++++++*/

//click on marker events
//--------------------------------
async function showWiki(e) {
    console.log("Clickd Marker of:",this.options.title)
    wikiData = await wikiData
    //console.log(wikiData)
    let markerTitle = this.options.title
    wikiData.forEach(element => {
        if (element.name == markerTitle) {
            //console.log(element.article)
            document.getElementById("wikiContent").innerHTML = "<h3>" + element.name + "</h3></br>" + element.article
        }
    })
}
async function weatherForecast(e) {
    
    let coordinates=this.getLatLng()
    let markerTitle=this.options.title
    drawChart(coordinates,markerTitle)
}
//------------------------------------------

//events triggered by drawing
//------------------------------------------
map.on("draw:created", function (e) {
    activeFeatures = []
    var layer = e.layer
    drawnFeatures.addLayer(layer)
    layerControl.addOverlay(layer, "draw layer")
    console.log("drawnFeatures", drawnFeatures)
    var overlays = layerControl.getOverlays()

    //overlays=[names of layers in Overlay, true||false (currently displayed?)]
    overlays.forEach(element => {
        if (element[1] == true)
            activeFeatures.push(element) //[names of labels currently drawn, true]
    })
    console.log("Active features: ", activeFeatures)
    var selectedCities = citySelect(activeFeatures, layer.toGeoJSON())
    allMarkerLocationFeatureGroups.push([selectedCities, "Selected Cities"])
    console.log("BoundingBox: ", drawnFeatures.getLayers()[0].toGeoJSON())

    //layerControl.addOverlay(layer,"drawn").addTo(map)
})

map.on("draw:drawstop", function () {

    //resets Map, only BoundingBox, SelectedCities and layers active before are drawn.
    map.eachLayer(layer => {
        map.removeLayer(layer)
    })
    osm.addTo(map)
    layerControl.remove()
    layerControl = L.control.layers(baseMaps).addTo(map);
    drawCityMarkers(allMarkerLocationFeatureGroups[allMarkerLocationFeatureGroups.length - 1][0], "Selected Cities")
    drawnFeatures.addTo(map)
    layerControl.addOverlay(drawnFeatures, "draw layer")
    map.removeControl(drawControl)
    map.addControl(drawControlfalse)


})
//draws only the markers which where displayed on map while drawing BoundingBox, when BoundingBox is edited
map.on("draw:editstart", function () {
    activeFeatures.forEach(element => {
        var label = element[0]
        allMarkerLocationFeatureGroups.forEach(feature => {
            if (label == feature[1]) {
                drawCityMarkers(feature[0], feature[1])
            }
        })

    })
    //drawCityMarkers(allMarkerLocationFeatureGroups[0][0]) //draw all markers of the original dataset
})


map.on("draw:editstop", function () {
    console.log("edited")
    var overlays = layerControl.getOverlays()
    var activeFeatures = []

    overlays.forEach(element => {
        if (element[1] == true)
            activeFeatures.push(element)
    })

    console.log("active: ", activeFeatures)
    //console.log("drawnFeatures: ", drawnFeatures.getLayers()[0])
    //console.log("edit1: ", allMarkerLocationFeatureGroups[0][1])
    //console.log("drawLayer1: ", drawnFeatures.getLayers()[0].toGeoJSON())

    var selectedCities = citySelect(activeFeatures, drawnFeatures.getLayers()[0].toGeoJSON())
    //var selectedCities = citySelect([["Cities"], [true]], drawnFeatures.getLayers()[0].toGeoJSON())

    console.log("selected Features: ", selectedCities)
    allMarkerLocationFeatureGroups.splice(allMarkerLocationFeatureGroups.length - 1, 1)
    //allMarkerLocationFeatureGroups.push([selectedCities, "Selected Cities"])
    map.eachLayer(layer => {
        map.removeLayer(layer)
    })
    osm.addTo(map)
    layerControl.remove()
    layerControl = L.control.layers(baseMaps).addTo(map);
    drawCityMarkers(selectedCities, "Selected Cities")
    layerControl.addOverlay(drawnFeatures, "draw layer").addTo(map)
    drawnFeatures.addTo(map)
})

map.on("draw:deletestart", function () {
    console.log("reset Map")
    drawnFeatures.clearLayers()
    map.eachLayer(layer => {
        map.removeLayer(layer)
    }
    )
    osm.addTo(map)
    layerControl.remove()
    layerControl = L.control.layers(baseMaps).addTo(map);
    drawCityMarkers(allMarkerLocationFeatureGroups[0][0], allMarkerLocationFeatureGroups[0][1])
    map.removeControl(drawControlfalse)
    map.addControl(drawControl)
    L.geoJSON(saxony).addTo(map)
})
//--------------------------------------------------

//events triggered by overlay changes
//---------------------------------------------------
map.on("overlayadd", function () {
    var overlays = layerControl.getOverlays()
    console.log("Overlay changed", overlays)
})
map.on("overlayremove", function () {
    var overlays = layerControl.getOverlays()
    console.log("Overlay changed", overlays)
})
//-------------------------------------------------------

//execute functions on loading ./map
try {
    drawCityMarkers(pointsCollection)
}
catch (error) {
    console.log("there is no valid .json: ", error)
}
