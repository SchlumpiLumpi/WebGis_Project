"use strict"

//make a map
var map = L.map('preview_map').setView([51, 13], 8)

//Layergroups
const saxonyLayer = L.geoJSON(saxony).addTo(map)
let markerLayerGroup = L.layerGroup()

//Baselayers
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
});
var CyclOSM = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
	maxZoom: 20,
	attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})
//these are our base layers
var baseMaps = {
    "OSM": osm,
    "OSM.Hot": osmHOT,
    "OSM.Cycle": CyclOSM
}
//here an layerControl is added to the map
var layerControl = L.control.layers(baseMaps).addTo(map);
layerControl.addOverlay(saxonyLayer, "saxony").addTo(map);

//draw cities
async function drawCityMarkers(cities) {
    if (cities == undefined) {
        console.log("there is no valid .json: cant draw markers")
    }
    else {
        //updateCities() //sets map to default
        var markerArr = []
        console.log("drawing markers....")
        //const tempData= await mergeWeatherData(cities)

        ///bind popups to marker
        cities.features.forEach(feature => {
            console.log("found feature: ", feature)
            let markerPosition = feature.geometry.coordinates
            let cityName = feature.properties['Place name']
            let imgpath = feature.properties.picture
            if (imgpath == undefined) {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b>"
                    )
            }
            else {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b>" +
                        "<a href=" + imgpath + " target='_blank'><img class='popUpimage' src='" + imgpath + "'/></a>")
            }
            var marker = L.marker([markerPosition[1], markerPosition[0]]).bindPopup(popup)
            markerArr.push(marker)
        });
        markerLayerGroup = L.layerGroup(markerArr).addTo(map)
        layerControl.addOverlay(markerLayerGroup, "Cities").addTo(map)
        console.log("add cities layer", markerLayerGroup)
        /*
        for (let i = 0; i < cities.features.length; i++) {
            console.log("iteration",i)
            console.log("Length check", cities.features.length)
            console.log("Draw Markers",cities.features[i].geometry.coordinates)
            //let markerPosition = [cities.features[i].geometry.coordinates[1], cities.features[i].geometry.coordinates[0]]
            let markerPosition = cities.features[i].geometry.coordinates
            let cityName = cities.features[i].properties['Place name']
            let imgpath = cities.features[i].properties.picture
            
            if (imgpath == undefined) {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b>"
                    )
    
            }
            else {
                var popup = L.popup()
                    .setContent(
                        "<b>" + cityName + "</b>" +
                        "<a href=" + imgpath + " target='_blank'><img class='popUpimage' src='" + imgpath + "'/></a>")
            }
            var marker = L.marker([markerPosition[1], markerPosition[0]]).bindPopup(popup)
            markerArr.push(marker)
        }
        markerLayerGroup = L.layerGroup(markerArr).addTo(map)
        layerControl.addOverlay(markerLayerGroup, "Cities").addTo(map)
        console.log("add cities layer", markerLayerGroup)
        */
    }
}

try{
    drawCityMarkers(pointsCollection)
}
catch(error){
    console.log("there is no valid .json: ",error)
}
