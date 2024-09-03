"use strict"
class WikiObject {
    constructor(name, article) {
        this.name = name
        this.article = article
    }
}

//get wikipedias introduction for a given wikipedia article
async function getWiki(city) {
    let content
    //console.log("getWIKI City",city)

    let name = city.properties["Place name"]
    let cityURL = city.properties["Wikipedia article"]
    if (cityURL == undefined || cityURL=="") {
        let undefinedObject = new WikiObject(name, "no wiki page available")
        return new Promise((resolve) => {
            resolve(undefinedObject)
        })
    }
    //console.log(cityURL)
    let splitURL = cityURL.split("/")
    //console.log(splitURL)
    let title = splitURL[splitURL.length - 1]
    //console.log("Wikipedia Site Title:", title)
    let wikipage = await fetch('https://de.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts&format=json&exintro=&titles=' + title)
    let wikiJSON = await wikipage.json()
    for (var key in wikiJSON.query.pages) {
        //console.log("Key: " + key);
        let id = key
        content = wikiJSON.query.pages[id].extract
        //console.log(content)
    }

    let wikiData = new WikiObject(name, content)
    return new Promise((resolve) => {
        resolve(wikiData)
    })

}
//iterates through given collection and find corresponding wikipedia articels if URL is provided 
async function mergeWikiData(cities) {
    console.log("...get Intros from Articles...")
    let wikiData = []
    for (var i = 0; i < cities.features.length; i++) {
        let section0 = await getWiki(cities.features[i])
        wikiData.push(section0)
    }
    console.log("received Wiki Article:", wikiData)
    return (wikiData)
}

function getWikiData() {
    try {
        return mergeWikiData(pointsCollection)
    }
    catch (error) {
        console.log("something went wrong: json is not available", error)
    }
}