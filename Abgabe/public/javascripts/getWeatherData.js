"use strict"
class TempObject {
    constructor(name,temp) {
        this.name=name    
        this.temp=temp    
    }
}

//get temperature for a given city
async function getWeather(city) {
    
    const apikey= "e028249cecdf2ae40900e3962318f043"
    let lat = city.geometry.coordinates[1].toString()
    let lon = city.geometry.coordinates[0].toString()
    const apiUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid="+apikey+"&units=metric&units=metric"
    const response = await fetch(apiUrl)
    const weatherData = await response.json()
    let temp=weatherData.main.temp
    let cityName=city.properties["Place name"]
    let temperatureData=new TempObject (cityName,temp)
    //console.log("temperature: ", temperatureData)
    return new Promise((resolve)=>{
        
        resolve (temperatureData)
    })
}
//takes cities.json and returns temperature values and citynames as an array
async function mergeWeatherData(cities){
console.log("get temperatures of cities...")
let temperatureData=[]
    for (var i=0;i<cities.features.length;i++){
    let temperature=await getWeather(cities.features[i])
    temperatureData.push(temperature)
}
console.log("received temperatures:", temperatureData)
return (temperatureData)
}