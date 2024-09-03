"use strict"

class ForecastObject {
    constructor(name,date,tempMax,tempMin,rainSum) {
        this.name=name  
        this.date=date
        this.tempMax=tempMax
        this.tempMin=tempMin
        this.rainSum=rainSum    
    }
}

//get weather forecast for 16days (maxTemp,minTemp,sumRain)
async function getWeatherForecast(coordinates,name) {
    
    console.log("get forecast data...")
    let lat = coordinates.lat.toString()
    let lon = coordinates.lng.toString()
    const apiUrl = "//api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&daily=temperature_2m_max,temperature_2m_min,rain_sum&timezone=Europe%2FBerlin&forecast_days=16"
    const response = await fetch(apiUrl)
    const forecastData = await response.json()
    
    let date=forecastData.daily.time
    let tempMax=forecastData.daily.temperature_2m_max
    let tempMin=forecastData.daily.temperature_2m_min
    let rainSum=forecastData.daily.rain_sum

    
    let forecastDaily=new ForecastObject (name,date,tempMax,tempMin,rainSum)
    console.log("received forecast data", forecastDaily)
    //console.log("temperature: ", temperatureData)
    return new Promise((resolve)=>{
        
        resolve (forecastDaily)
    })
}
