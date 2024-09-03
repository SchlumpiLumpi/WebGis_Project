"use strict"

//create empty instance, necessary for dynamically changing chart on marker clicks on map
let myChart = new Chart()
// rendering the temperature chart
async function drawChart(coordinates, name) {
    //drawing chart
    console.log("draw chart...")
    const ctx = document.getElementById('forecastChart')
    myChart.destroy()
    document.getElementById('forecastChart')
    

    let forecastData = await getWeatherForecast(coordinates, name)
    //console.log(forecastData)
    let label = forecastData.date
    let tempMax = forecastData.tempMax
    let tempMin = forecastData.tempMin
    let rainSum = forecastData.rainSum


    let minTemp = Math.min(tempMin);
    let maxTemp = Math.max(tempMax);
    let minRain = Math.min(rainSum);
    let maxRain = Math.max(rainSum);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: label,
            datasets: [{
                label: 'tempMax [°C]',
                data: tempMax,
                borderWidth: 1,
                yAxisID: 'ytemp',
                borderColor: '#d90c0c',
                backgroundColor: '#d90c0c',
            },
            {
                label: 'tempMin [°C]',
                data: tempMin,
                borderWidth: 1,
                yAxisID: 'ytemp',
                borderColor: '#04829e',
                backgroundColor: '#04829e',
            },
            {
                label: 'rainSum [mm]',
                data: rainSum,
                borderWidth: 1,
                yAxisID: 'yrain',
                borderColor: '#0b07f6',
                backgroundColor: '#0b07f6',

            }]
        },
        options:
        {
            plugins: {
                title: {
                    display: true,
                    text: 'Weather Forecast [16 days]'
                },
            },
            //maintainAspectRatio: false,
            // responisive:true,
            scales:
            {
                ytemp: {
                    type: "linear",
                    display: "true",
                    position: "left",
                    suggestedMin: minTemp,
                    suggestedMax: maxTemp,
                },
                yrain: {
                    type: "linear",
                    display: "true",
                    position: "right",
                    suggestedMin: minRain,
                    suggestedMax: maxRain
                }
            }
        }
    });

}
