
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
    var data = dlSync("https://api.delijn.be/DLZoekOpenData/v1/zoek/haltes/" + query);
    if (!data)
        return;

    var matchingFeatures = [];
    for(var i = 0; i < data.haltes.length; i++)
    {
        var lijn = data.haltes[i];

        var feature = {};
        feature['place_name'] = "🚌 " + lijn.omschrijving;
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

var selectedStop1, selectedStop2;
function showLijnResults()
{
    var resultsElement = document.getElementById("route-ov-lijn-results");
    resultsElement.innerHTML = null;

    if (!selectedStop1 || !selectedStop2)
        return;

    var time = document.getElementById("route-ov-go-time").value;
    var arrive = document.getElementById("route-ov-period-go-type-arrive").checked;
    var today = document.getElementById("route-ov-go-period-today").checked;
    
    console.log("time: " + time);
    console.log(arrive ? "arrive" : "depart");
    console.log(today ? "today" : "tomorrow");

    var startOfDay = moment().startOf('day');
    var timeMoment = moment(time,"hh:mm");
    startOfDay = startOfDay.add(timeMoment.hours(), 'hours').add(timeMoment.minutes(), 'minutes');
    if (!today)
        startOfDay = startOfDay.add(1, 'days');

    console.log("startOfDay: " + startOfDay.format("YYYY-MM-DD'T'HH:mm:ss"));
  

    //selectedStop1.entiteitnummer
    //selectedStop1.haltenummer -> {latitude longitude}
    //selectedStop1.omschrijving
    //selectedStop1.geoCoordinaat

    //var url = "https://api.delijn.be/DLKernOpenData/api/v1/routeplan/{vertrekLatlng}/{bestemmingLatlng}[&tijdstip][&vertrekAankomst][&vervoersOptie]"
    //https://api.delijn.be/DLKernOpenData/api/v1/routeplan/{vertrekLatlng}/{bestemmingLatlng}[?aanvraagType][&tijdstip][&vertrekAankomst][&vervoersOptie]
    //dl()

    
    /*for(var i = 0; i < lijnData.length; i++)
    {
        var listElement = document.createElement("li");
        listElement.innerText = "lijn result";
    }*/
    
}

$(() => {
  
    var markerTemplate = $("#marker-template").html();
    
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

    /*var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    $("#main-geocoder").append(geocoder.onAdd(map));*/



    //https://api.delijn.be/DLZoekOpenData/v1/zoek/haltes/{zoekArgument}[?huidigePositie][&startIndex][&maxAantalHits]

   

	var mapLijnPlannerGeocoder1 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Vertrekhalte",
        mapboxgl: mapboxgl
    });
    $("#map-lijn-planner-geocoder1").append(mapLijnPlannerGeocoder1.onAdd(map));
    mapLijnPlannerGeocoder1.on('result', function(result) {
        selectedStop1 = result.result["lijn_data"];
        showLijnResults();
    });

    var mapLijnPlannerGeocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Aankomsthalte",
        mapboxgl: mapboxgl
    });
    $("#map-lijn-planner-geocoder2").append(mapLijnPlannerGeocoder2.onAdd(map));
    mapLijnPlannerGeocoder2.on('result', function(result) {
        selectedStop2 = result.result["lijn_data"];
        showLijnResults();
    });


    


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

});



