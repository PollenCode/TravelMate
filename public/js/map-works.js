
function getLocation(callback) {
    if (navigator.geolocation) 
    {
        navigator.geolocation.getCurrentPosition(callback);
    } 
    else 
    {
        console.warn("Geolocation is not supported by this browser.");
    }
}

const dlApiKey = "2a64f6a71f1f406bb38bc3c7871594c7";
function dl(url, success, error, method = "GET")
{
    $.ajax({
        url: url,
        headers: {"Ocp-Apim-Subscription-Key": dlApiKey},
        type: method,
        dataType: "json",
        async: true,
        success: (e) => { 
            success(e);
        },
        error: (e) => {
            console.error("[tm] De Lijn request could not succeed: " + e);
            error(e);
        }
    });
}

function dlSync(url, method = "GET")
{
    var value = null;
    $.ajax({
        url: url,
        headers: {"Ocp-Apim-Subscription-Key": dlApiKey},
        type: method,
        dataType: "json",
        async: false,
        success: (e) => { 
            value = e;
        },
        error: (e) => {
            console.error("[tm] De Lijn request could not succeed: " + e);
        }
    });
    return value;
}

function lijnGeocoder(query) 
{
    //https://www.delijn.be/nl/zakelijk-aanbod/reisinfodata/gebruik-onze-data.html
    var data = dlSync("https://api.delijn.be/DLZoekOpenData/v1/zoek/haltes/" + query);
    if (!data)
        return;

    var matchingFeatures = [];
    for(var i = 0; i < data.haltes.length; i++)
    {
        var lijn = data.haltes[i];

        var feature = {};
        feature['place_name'] = lijn.omschrijving;
        feature['center'] = {lng: lijn.geoCoordinaat.longitude, lat: lijn.geoCoordinaat.latitude};
        feature['place_type'] = ['place'];
        feature["lijn_data"] = lijn;

        matchingFeatures.push(feature);
    }
    return matchingFeatures;
}

var loadedStops = {}
var map;
var start = [-122.662323, 45.523751];

$(() => {
  
    var markerTemplate = $("#marker-template").html();
    console.log(markerTemplate);
    function createDlMarker(forStop)
    {
        var el = document.createElement('div');
        el.innerHTML = markerTemplate
            .replace("{stop.id}", forStop.id)
            .replace("{stop.name}", forStop.naam);//"<i class='fas fa-map-marker'></i>";//result.haltes[i].naam;
        el.className = 'marker';
        return el;
    }

    function createDlPopup()
    {
        
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiY29kZXN0aXgiLCJhIjoiY2sxN2xoYjloMWRpbTNucDNneWU4Y3piMCJ9.zAJbMIgcDUtRF99YYvpaOg';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [4.4699 , 50.50399],
        zoom: 7.2
    });

    var canvas = map.getCanvasContainer();
    
    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    $("#geocoder").append(geocoder.onAdd(map));

    //https://api.delijn.be/DLZoekOpenData/v1/zoek/haltes/{zoekArgument}[?huidigePositie][&startIndex][&maxAantalHits]


	var mapLijnPlannerGeocoder1 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Geeft halte",
        mapboxgl: mapboxgl
    });
    var el = mapLijnPlannerGeocoder1.onAdd(map);
    $("#map-lijn-planner-geocoder1").append(el);
    mapLijnPlannerGeocoder1.on('result', function(result) {
        var el = document.querySelector("#map-lijn-planner-geocoder1 ul");
        el.innerHTML = "";

        dl("", (data) => {}, (ex) => {});
    });
   /* var mapLijnPlannerGeocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Geeft halte",
        mapboxgl: mapboxgl
    });
    $("#map-lijn-planner-geocoder2").append(mapLijnPlannerGeocoder2.onAdd(map));*/



    var getStopsFunc = (result) => {

        const center = map.getCenter();
        const zoom = map.getZoom();
        if (zoom > 12.0)
        {
            const region = 10000 - (zoom - 12.0) * 1000
            console.log("region: " + region + ", zoom: " + zoom);
            dl("https://api.delijn.be/DLKernOpenData/v1/beta/haltes/indebuurt/" + center.lat + "," + center.lng + "?" + region, (result) => {

                for(var i = 0; i < result.haltes.length; i++)
                {
                    const stop = result.haltes[i];
                    const stopId = stop.id;

                    if (stopId in loadedStops)
                        continue;

                    loadedStops[stopId] = stop;

                    /*var el = document.createElement('div');
                    el.innerHTML = "<i class='fas fa-map-marker'></i>";//result.haltes[i].naam;
                    el.className = 'marker';*/
                    var el = createDlMarker(stop);
                    
                    // make a marker for each feature and add to the map
                    var lngLat = result.haltes[i].geoCoordinaat;
                    new mapboxgl.Marker(el)
                        .setLngLat({lng: lngLat.longitude, lat: lngLat.latitude})
                        .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
                        .setHTML("id: " + result.haltes[i].id))
                        .addTo(map)
                }

            }, (ex) => { });
        }
    };

    map.on("dragend", getStopsFunc);
    map.on("zoomend", getStopsFunc);

    getLocation((position) => {
        if (position.coords.accuracy <= 10000)
        {
            map.flyTo({
                center: {lng: position.coords.longitude, lat: position.coords.latitude},
                zoom: 12.0
            })
        }
    });

    console.log("[tm] mapworks loaded. o/");



function getRoute(end) {
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  var start = [-122.662323, 45.523751];
  var url = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

  // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  var req = new XMLHttpRequest();
  req.responseType = 'json';
  req.open('GET', url, true);
  req.onload = function() {
    var data = req.response.routes[0];
    var route = data.geometry.coordinates;
    var geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route
      }
    };
    // if the route already exists on the map, reset it using setData
    if (map.getSource('route')) {
      map.getSource('route').setData(geojson);
    } else { // otherwise, make a new request
      map.addLayer({
        id: 'route',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: geojson
            }
          }
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    }
    // add turn instructions here at the end
  };
  req.send();
}

// create a function to make a directions request


map.on('load', function() {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(start);

  // Add starting point to the map
  map.addLayer({
    id: 'point',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: start
          }
        }
        ]
      }
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#3887be'
    }
  });
  // this is where the code from the next step will go
});

map.on('click', function(e) {
  var coordsObj = e.lngLat;
  canvas.style.cursor = '';
  var coords = Object.keys(coordsObj).map(function(key) {
    return coordsObj[key];
  });
  var end = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: coords
      }
    }
    ]
  };
  if (map.getLayer('end')) {
    map.getSource('end').setData(end);
  } else {
    map.addLayer({
      id: 'end',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: coords
            }
          }]
        }
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#f30'
      }
    });
  }
  getRoute(coords);
});


});



