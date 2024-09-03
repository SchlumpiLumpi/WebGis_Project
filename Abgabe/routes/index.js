"use strict"

var express = require('express');
var router = express.Router();
const fs = require("fs")
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink)
const turf = require("@turf/helpers")
const turfInside = require("@turf/boolean-point-in-polygon")

//get sachsen.geojson
const saxony = JSON.parse(fs.readFileSync('./public/geoJSON/sachsen.geojson'))
const saxonyPoly = turf.polygon(saxony.features[0].geometry.coordinates)

//MongoDB
const { MongoClient } = require('mongodb')
const url = 'mongodb://localhost:27017' // connection URL
const client = new MongoClient(url) // mongodb client
const dbName = 'mydb' // database name
const collectionName = 'uploaded_files' // collection name

//BodyParser
const bodyParser = require('body-parser');
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }));

// Multer - File Upload
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }) // creates temporary folder for uploaded files

// GET home page. 
router.get('/', async function (req, res) {

  const result = await get_data_from_db()
  const result_as_fc = turf.featureCollection(result);
  res.render('index', { pointsCollection: JSON.stringify(result_as_fc) });

});

router.post('/clearSelection', async (req, res) => {
  const db = client.db(dbName)
  const collection = db.collection(collectionName)
  console.log("delete previous data from collection...")
  await collection.deleteMany() //clears database
  const result = await get_data_from_db()
  const result_as_fc = turf.featureCollection(result);
  res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })

})

//option 1: upload local file
router.post('/uploadLocalFile', upload.single('file_upload'), (req, res) => {

  try {
    console.log("receiving data...")
    let filename = req.file.originalname
    //test for fileExtension .json || .geojson
    let filenameSplit = filename.split(".")
    //console.log(splitURL)
    let extension = filenameSplit[filenameSplit.length - 1]
    console.log(extension.toLowerCase())
    if (extension.toLowerCase() !== "json" && extension.toLowerCase() !== "geojson") {
      console.log("file extension has to be .json OR .geojson")
      res.render('index')
    }
    else {
      console.log("received: ", filename)
      let path = req.file.path
      fs.readFile(path, 'utf-8', async function (err, data) {
        if (err) {
          console.log("cannot read file")
          res.render('index')
          throw err;
        }
        const content = data;
        unlinkAsync(path)

        //throws error if file isnt in .json format
        try {
          const dataJSON = JSON.parse(content)
          console.log("YourData:", dataJSON)
          if (insideSaxony(dataJSON) == false) {

            res.render('index')
          }
          else {
            await save_data_to_db(dataJSON)

            console.log(filename + " added to Database: ", dataJSON)
            const result = await get_data_from_db()
            const result_as_fc = turf.featureCollection(result);
            res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })
          }
        }
        catch (error) {

          console.log("false fileformat")
          res.render('index')
        }
      });
    }
  }
  catch (error) {
    console.log("form is empty")
    res.render('index')
  }

})

//option 2: use text input for uploading JSON
router.post('/uploadTextFile', async (req, res) => {
  console.log("receiving data...")
  try {
    const data = JSON.parse(req.body.json_input)
    console.log("YourData:", data)
    if (insideSaxony(data) == false) {
      res.render('index')
    }
    else {
      await save_data_to_db(data)
      console.log("uploaded file", data)
      const result = await get_data_from_db()
      const result_as_fc = turf.featureCollection(result);
      res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })
    }
  }
  catch (error) {
    console.log("false fileformat")
    res.render('index')
  }

})

//option 3: add single Point to Collection
router.post("/uploadSinglePoint", async (req, res) => {
  console.log("receiving data...")
  var lat = req.body.newPointLat
  var lon = req.body.newPointLon
  var name = req.body.newPointName
  var imgUrl = req.body.newPointImg
  if (lat == "" || lon == "" || name == "") {

    console.log("can't upload single point")
    const result = await get_data_from_db()
    const result_as_fc = turf.featureCollection(result);
    res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })

  }
  else {
    try {
      console.log("Inputs for SinglePoint: ", lat, lon, name, imgUrl)
      //create Object for JSON
      let myObject = {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": { "Place name": name, "Wikipedia article": imgUrl },
            "geometry": {
              "coordinates": [
                lon, lat
              ],
              "type": "Point"
            }
          }]
      }
      let myObjectSimpleFeature = {
        "type": "Feature",
        "properties": { "Place name": name, "Wikipedia article": imgUrl },
        "geometry": {
          "coordinates": [
            lon, lat
          ],
          "type": "Point"
        }
      }

      let myJSON = JSON.stringify(myObject)
      if (insideSaxony(myObject) == false) {
        console.log('test', insideSaxony(myObject))
        const result = await get_data_from_db()
        const result_as_fc = turf.featureCollection(result);
        res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })
      }
      else {
        await add_Point_to_DB(myObjectSimpleFeature)
        console.log("parsed JSON", JSON.parse(myJSON))
        const result = await get_data_from_db()
        const result_as_fc = turf.featureCollection(result);
        res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })
      }
    }
    catch (error) {
      console.log(error)
      console.log("can't upload single point")
      const result = await get_data_from_db()
      const result_as_fc = turf.featureCollection(result);
      res.render('index', { pointsCollection: JSON.stringify(result_as_fc) })
    }
  }
})

// add multiple JSON-objects to DB
async function save_data_to_db(data) {

  console.log("Saving to database...")
  console.log(data)

  await client.connect()
  console.log('Connected successfully to server')

  const db = client.db(dbName)

  const collection = db.collection(collectionName)

  console.log("delete previous data from collection...")
  await collection.deleteMany() //clears database

  // this option prevents additional documents from being inserted if one fails
  const options = { ordered: true }
  const result = await collection.insertMany(data.features, options)
  console.log(`${result.insertedCount} documents were inserted in the collection`)
}



//add an single Point to DB collection
async function add_Point_to_DB(data) {
  console.log("Saving to database...")
  console.log(data)
  const db = client.db(dbName)
  const collection = db.collection(collectionName)
  
  // this option prevents additional documents from being inserted if one fails
  const options = { ordered: true }
  const result = await collection.insertOne(data)
  console.log("1 document was inserted in the collection")
}



async function get_data_from_db() {
  await client.connect()
  console.log('Connected successfully to server')

  const db = client.db(dbName)

  const collection = db.collection(collectionName)

  const cursor = collection.find({})

  const results = await cursor.toArray()

  if (results.length == 0) {

    console.log("No documents found!")

  }
  else {
    console.log(`Found ${results.length} documents in the collection...`);
    //console.log(results)

  }

  return results
}

function insideSaxony(data) {
  let flag = 0
  try {
    data.features.forEach(feature => {
      var featurePoint = turf.point(feature.geometry.coordinates)
      let isInside = turfInside.booleanPointInPolygon(featurePoint, saxonyPoly)
      if (isInside == false) {
        throw feature.properties["Place name"] + " is not within saxony"
      }
      console.log("City " + feature.properties["Place name"], " within saxony:" + isInside)
    })
  }
  catch (error) {
    console.log("cannot upload file: ", error)
    flag = flag + 1
  }
  if (flag == 0) {
    return true
  }
  else {
    return false
  }
}

module.exports = router;
