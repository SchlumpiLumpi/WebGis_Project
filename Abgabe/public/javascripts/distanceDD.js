"use strict"

const dresden=turf.point([13.73836,51.049259])

// computes distance from given location to dresden
function distance2DD(point){
    var pointTurf=turf.point([point[0],point[1]])
    var distanceTurf = turf.distance(pointTurf, dresden);
    distanceTurf = Math.round(distanceTurf * 1000) / 1000
    return distanceTurf
}
