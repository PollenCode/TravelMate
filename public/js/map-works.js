const lijnColors = {"WI":"FFFFFF","TU":"0099AA","RZ":"FF88AA","OR":"EE8822","RO":"BB0022","PA":"991199","MA":"DD0077","LB":"AACCEE","GE":"FFCC11","GR":"229922","MU":"77CCAA","ZW":"000000","KA":"995511","BL":"1199DD","CR":"C5AA77","ZA":"FFCCAA","GD":"FFDD00","BD":"000099","BO":"771133","KI":"444411","DB":"0044BB","LG":"BBDD00","PE":"005555","ST":"8899AA"};

var direcions;

var routePlanType;
var currentOvRoute;

var knownLijnColors = {};
function getLijnColors(lijnEntity, lijnNum)
{
    if (!knownLijnColors || knownLijnColors.length == 0)
    {
        return {
            background: "#333333",
            foreground: "#FFFFFF"
        };
    }

    var colors = knownLijnColors.lijnLijnkleurCodesLijst;
    var results = colors.filter((e) => e.lijn.entiteitnummer == lijnEntity && e.lijn.lijnnummer.includes(lijnNum));
    if (results.length == 0)
    {
        return {
            background: "#333333",
            foreground: "#FFFFFF"
        };
    }
    else 
    {
        return {
            background: "#" + lijnColors[results[0].lijnkleurCodes.achtergrond.code],
            foreground: "#" + lijnColors[results[0].lijnkleurCodes.voorgrond.code]
        };
    }
}

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
        feature['place_name'] = "Halte " + lijn.omschrijving + " (" + lijn.haltenummer + ")";
        feature['center'] = {lng: lijn.geoCoordinaat.longitude, lat: lijn.geoCoordinaat.latitude};
        feature['place_type'] = ['place'];
        feature["lijn_data"] = lijn;

        matchingFeatures.push(feature);
    }
    return matchingFeatures;
}

function showMapLijnRoute(route)
{
    currentOvRoute = route;

    var coordsAndColors = [];
    for(var i = 0; i < route.reiswegStappen.length; i++)
    {
        var step = route.reiswegStappen[i];

        if (step.type == "WACHTEN")
            continue;

        var coords = [];

        for(var j = 0; j < step.geoCoordinaten.length; j++)
        {
            var geo = step.geoCoordinaten[j];
            coords.push([geo.longitude, geo.latitude]);
        }

        var color = "#777";
        if (step.type != "WANDELEN")
        {
            color = getLijnColors(step.lijnrichting.entiteitnummer, step.lijnrichting.lijnnummer).background;
        }

        coordsAndColors.push({
            coords: coords,
            color: color
        });
    }
    setMapLayerCoords("ov-layer", coordsAndColors);
}

function loadFriendRoutes()
{
    var el = document.getElementById("friend-routes");
    el.innerHTML = null;

    $.ajax({
        url: "/api/user/getFriendRoutes",
        type: "POST",
        async: true,
        success: (e) => {     
            var friends = e.data;
            for(var i = 0; i < friends.length; i++)
            {
                var friend = friends[i];
                if (!friend.currentRoute)
                    continue;
                var friendRoute = JSON.parse(friend.currentRoute);
                if (friendRoute.type == "none")
                    continue;
                console.log(friendRoute);

                var elFriend = document.createElement("li");
                var elFriendName = document.createElement("h4");
                elFriendName.innerText = friend.firstName + " " + friend.lastName;
                elFriend.appendChild(elFriendName);
                var elFriendRouteTime = document.createElement("h5");
                elFriendRouteTime.innerText = (friendRoute.data.today ? "Vandaag" : "Morgen")
                     + " om " + friendRoute.data.time;
                elFriend.appendChild(elFriendRouteTime);
                var elFriendRouteDescription = document.createElement("p");
                elFriendRouteDescription.innerHTML = friendRoute.data.origin
                    + " <i class='fas fa-long-arrow-alt-right'></i> " 
                    + friendRoute.data.destination;
                elFriend.appendChild(elFriendRouteDescription);
                var elFriendRouteType = document.createElement("h5");
                elFriendRouteType.innerText = (friendRoute.type == "car" ? "Met de auto." : "Met het openbaar veroer.");
                elFriend.appendChild(elFriendRouteType);
                var elFriendSelect = document.createElement("button");
                elFriendSelect.classList.add("btn2");
                elFriendSelect.innerText = "Bekijk";
                function setClickEvent(userId)
                {
                    elFriendSelect.onclick = function(){
                        loadRoute(userId)
                    };
                }
                setClickEvent(friend.id);
                elFriend.appendChild(elFriendSelect);
                el.appendChild(elFriend);
            }
        },
        error: (e) => {
            console.error("Could not load route", e);
        }
    }); 
}

var loadedStops = {};
var map;
var start = [-122.662323, 45.523751];

var lijnRoutes = {};
var selectedStop1, selectedStop2;
var isFirstLijnSearch = true;
function showLijnResults(cancelIfNotFirst = false)
{
    if (!selectedStop1 || !selectedStop2 || (cancelIfNotFirst && !isFirstLijnSearch))
        return;
    isFirstLijnSearch = false;

    var resultsElement = document.getElementById("route-ov-lijn-results");
    resultsElement.innerHTML = null;
    setPageLoading(true);

    var time = document.getElementById("route-ov-go-time").value;
    var arrive = document.getElementById("route-ov-period-go-type-arrive").checked;
    var today = document.getElementById("route-ov-go-period-today").checked;
    
    /*console.log("time: " + time);
    console.log(arrive ? "arrive" : "depart");
    console.log(today ? "today" : "tomorrow");*/
    //selectedStop.entiteitnummer
    //selectedStop.haltenummer -> {latitude longitude}
    //selectedStop.omschrijving
    //selectedStop.geoCoordinaat

    var startOfDay = moment().startOf('day');
    var timeMoment = moment(time,"hh:mm");
    startOfDay = startOfDay.add(timeMoment.hours(), 'hours').add(timeMoment.minutes(), 'minutes');
    if (!today)
        startOfDay = startOfDay.add(1, 'days');
    var timeMoment = startOfDay.format("YYYY-MM-DDTHH:mm:ss");
    console.log(timeMoment);
    var url = "https://api.delijn.be/DLKernOpenData/api/v1/routeplan/" 
        + selectedStop1.geoCoordinaat.latitude + "," + selectedStop1.geoCoordinaat.longitude + "/" 
        + selectedStop2.geoCoordinaat.latitude + "," + selectedStop2.geoCoordinaat.longitude 
        + "?aanvraagType=INITIEEL" + "&tijdstip=" + timeMoment + "&vertrekAankomst=" + (arrive ? "AANKOMST" : "VERTREK");      

    dl(url, (data) => {

        lijnRoutes = {};
        var lijnColorQueryKeys = "";
        for(var i = 0; i < data.reiswegen.length; i++)
        {
            var steps = data.reiswegen[i].reiswegStappen;
            for(var j = 0; j < steps.length; j++)
            {
                var step = steps[j];
                if (step.type == "VOERTUIG" && step.maatschappijType == "DE_LIJN")
                {
                    lijnColorQueryKeys += "_" + step.lijnrichting.entiteitnummer + "_" + step.lijnrichting.lijnnummer;
                }
            }
        }
        if (lijnColorQueryKeys.length > 0) // Remove '_'
            lijnColorQueryKeys = lijnColorQueryKeys.substring(1);

        var showLijnRoutes = function()
        {
            var bestRoute = null;
            for(var i = 0; i < data.reiswegen.length; i++)
            {
                var route = data.reiswegen[i];
                lijnRoutes[i] = route;
                var routeStartTime = moment(route.duurtijd.start, "yyyy-MM-DDTHH:mm:ss").format("HH:mm");
                var routeEndTime = moment(route.duurtijd.einde, "yyyy-MM-DDTHH:mm:ss").format("HH:mm");
                
                if (!route.reiswegStappen)
                    continue;
                if (route.bestpassend)
                    bestRoute = route;
                
                var el = document.createElement("li");
                el.style["position"] = "relative";
                el.classList.add("route-ov-lijn-result");
                var elDescription = document.createElement("h4");
                elDescription.innerText = routeStartTime + " - " + routeEndTime;
                if (route.bestpassend)
                    elDescription.innerHTML += " <i class='fas fa-star'></i> Beste";
                el.appendChild(elDescription);
                var elSelectRoute = document.createElement("button");
                elSelectRoute.innerText = "Selecteer";
                elSelectRoute.classList.add("btn2");
                elSelectRoute.setAttribute("href","#");
                elSelectRoute.style["position"] = "absolute";
                elSelectRoute.style["top"] = "5px";
                elSelectRoute.style["right"] = "5px";
                function setClickEvent(clickRoute)
                {
                    elSelectRoute.onclick = () => {
                        showMapLijnRoute(clickRoute);
                        saveRoute();
                    };
                }
                setClickEvent(route);
                
                el.appendChild(elSelectRoute);

                var elStepsList = document.createElement("ul");
                for(var j = 0; j < route.reiswegStappen.length; j++)
                {
                    var step = route.reiswegStappen[j];
                    var stepType = step.type;
                    var stepStartMoment = moment(step.duurtijd.start, "yyyy-MM-DDTHH:mm:ss")
                    var stepEndMoment = moment(step.duurtijd.einde, "yyyy-MM-DDTHH:mm:ss")
                    var stepStartTime = stepStartMoment.format("HH:mm");
                    var stepEndTime = stepEndMoment.format("HH:mm");
                    var stepMinutes = stepEndMoment.diff(stepStartMoment,"minutes");
    
                    var elStep = document.createElement("li");
                    var elStepTitle = document.createElement("h6");
                    elStepTitle.innerText = stepStartTime + " - " + stepEndTime;
                    elStep.appendChild(elStepTitle);
                    var elStelDescription = document.createElement("p");
                    if (stepType == "WANDELEN")
                    {
                        elStelDescription.innerText = step.afstand + "m wandelen";
                    }
                    else if (stepType == "VOERTUIG")
                    {
                        var colors = getLijnColors(step.lijnrichting.entiteitnummer, step.lijnrichting.lijnnummer);
                        var lijnTagStyles = "background-color: " + colors.background + "; color: " + colors.foreground + ";";
                        var lijnNumber = step.lijnrichting.lijnnummer.substring(1);
                        var coloredLijnTag = "<span class='lijn-number-tag' style='" + lijnTagStyles + "'>" + lijnNumber + "</span>";
                        elStelDescription.innerHTML = "Met de " + coloredLijnTag;
                    }
                    else if (stepType == "WACHTEN")
                    {
                        elStelDescription.innerText = stepMinutes + " min wachten";
                    }
                    elStep.appendChild(elStelDescription);
                    elStepsList.appendChild(elStep);
                }
                el.appendChild(elStepsList);

                if (route.bestpassend)
                    resultsElement.insertBefore(el,resultsElement.firstChild);
                else
                    resultsElement.appendChild(el);
            }

            if (bestRoute)
            {
                showMapLijnRoute(bestRoute);
                saveRoute();
            }

            document.getElementById("route-ov-seach-results").style.display = "block";
        }

        dl("https://api.delijn.be/DLKernOpenData/api/v1/lijnen/lijst/" + lijnColorQueryKeys + "/lijnkleuren", (dataColors) => {  
            knownLijnColors = dataColors;
            setPageLoading(false);
            showLijnRoutes();
        }, (err) => {
            setPageLoading(false);
            showLijnRoutes();
            console.log("Could not get colors.");
        });

    }, (err) => {
        setPageLoading(false);
        console.log("Could not get route.");
    });
}

$(() => {
  
    var markerTemplate = document.getElementById("marker-template").innerHTML;
    function createDlMarker(forStop)
    {
        var el = document.createElement('div');
        el.innerHTML = markerTemplate
            .replace("{stop.id}", forStop.id)
            .replace("{stop.name}", forStop.naam);
        el.className = 'marker';
        return el;
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiY29kZXN0aXgiLCJhIjoiY2sxN2xoYjloMWRpbTNucDNneWU4Y3piMCJ9.zAJbMIgcDUtRF99YYvpaOg';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [4.4699 , 50.50399],
        zoom: 7.2
    });
    map.on("load", () => {
        loadRoute();
        loadFriendRoutes();
    });

	var mapLijnPlannerGeocoder1 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Vertrekhalte",
        mapboxgl: mapboxgl,
        countries: 'be'
    });
    $("#map-lijn-planner-geocoder1").append(mapLijnPlannerGeocoder1.onAdd(map));
    mapLijnPlannerGeocoder1.on('result', function(result) {
        selectedStop1 = result.result["lijn_data"];
        showLijnResults(true);
    });

    var mapLijnPlannerGeocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        localGeocoder: lijnGeocoder,
        zoom: 14,
        placeholder: "Aankomsthalte",
        mapboxgl: mapboxgl,
        countries: 'be'
    });
    $("#map-lijn-planner-geocoder2").append(mapLijnPlannerGeocoder2.onAdd(map));
    mapLijnPlannerGeocoder2.on('result', function(result) {
        selectedStop2 = result.result["lijn_data"];
        showLijnResults(true);
    });

    directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric'
    });
    directions.actions.eventSubscribe("route", () => {
        //saveRoute();
        try {
            directions.mapState();
        }
        catch(e){}
    });

    var getStopsFunc = (result) => {

        const center = map.getCenter();
        const zoom = map.getZoom();
        if (zoom > 14.0)
        {
            const region = 3000;
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

function clearMapLayerCoords(layerName)
{
    if (map.getSource(layerName))
    {
        map.getSource(layerName).setData({});
    }
}
function setMapLayerCoords(layerName, coordinatesColorPairs)
{
    var geoJson = {
        type: "FeatureCollection",
        features: []
    };
    for(var i = 0; i < coordinatesColorPairs.length; i++)
    {
        geoJson.features.push({
            type: "Feature",
            properties: {
                color: coordinatesColorPairs[i].color
            },
            geometry: {
                type: "LineString",
                coordinates: coordinatesColorPairs[i].coords
            }
        });
    }

    if (map.getSource(layerName))
    {
        map.getSource(layerName).setData(geoJson);
    }
    else
    {
        map.addLayer({
            "id": layerName,
            "type": "line",
            "source": {
                "type": "geojson",
                "data": geoJson
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-width": 8,
                "line-color": ["get","color"]
            }
        });
    }
}

function saveRoute() 
{
    console.log("Saving route for " + routePlanType);

    $.ajax({
        url: "/api/user/setRoute",
        type: "POST",
        // dataType: "json",
        async: true,
        data: { 
            route: JSON.stringify(getRoute()) 
        },
        success: (e) => {  },
        error: (e) => {
            console.error("Could not save route",e);
        }
    });
}

function getRoute()
{
    if (routePlanType == null)
    {
        return {
            type: "none",
            data: null
        }
    }
    else if (routePlanType == "car")
    {
        var directionsInputs = document.querySelectorAll(".mapboxgl-ctrl-directions input");
        return {
            type: "car",
            data: {
                origin: directionsInputs[0].value,
                destination: directionsInputs[1].value,
                time: document.getElementById("route-car-go-time").value,
                today: document.getElementById("route-car-go-period-today").checked
            }
        }
    }
    else if (routePlanType == "ov")
    {
        return {
            type: "ov",
            data: {
                origin: document.querySelector("#map-lijn-planner-geocoder1 input").value,
                destination: document.querySelector("#map-lijn-planner-geocoder2 input").value,
                arrive: document.getElementById("route-ov-period-go-type-arrive").checked,
                time: document.getElementById("route-ov-go-time").value,
                today: document.getElementById("route-ov-go-period-today").checked,
                ovRoute: currentOvRoute,
                ovLijnColors: knownLijnColors
            }
        }
    }
}

function setRoute(route)
{
    console.log("Setting route ", route);

    if (!route || route.type == "none")
    {
        selectTab('searchmenu-tab','searchmenu-tab-no-route'); 
        planSelectRouteType(null);
    }
    else if (route.type == "car")
    {
        selectTab('searchmenu-tab','searchmenu-tab-car'); 
        planSelectRouteType('car');
        directions.setOrigin(route.data.origin);
        directions.setDestination(route.data.destination);
        document.getElementById("route-car-go-time").value = route.data.time;
        document.getElementById("route-car-go-period-today").checked = route.data.today;
    }
    else if (route.type == "ov")
    {
        selectTab('searchmenu-tab','searchmenu-tab-ov'); 
        planSelectRouteType('ov');
        document.querySelector("#map-lijn-planner-geocoder1 input").value = route.data.origin;
        document.querySelector("#map-lijn-planner-geocoder2 input").value = route.data.destination;
        document.getElementById("route-ov-period-go-type-arrive").checked = route.data.arrive;
        document.getElementById("route-ov-go-time").value = route.data.time;
        document.getElementById("route-ov-go-period-today").checked = route.data.today;
        knownLijnColors = route.data.ovLijnColors;
        showMapLijnRoute(route.data.ovRoute);
    }
}

function loadRoute(userId = null)
{
    $.ajax({
        url: "/api/user/getRoute",
        type: "POST",
        // dataType: "json",
        async: true,
        data: {
            userId: userId
        },
        success: (e) => {     
            setRoute(e.data);
        },
        error: (e) => {
            console.error("Could not load route", e);
        }
    }); 
}

function planSelectRouteType(type)
{
    routePlanType = type;
    var mapRouteCtrl = document.getElementsByClassName("mapboxgl-ctrl-directions")[0];

    if (mapRouteCtrl != null && type != "car")
        mapRouteCtrl.style.display = "none";
    else if (mapRouteCtrl != null)
        mapRouteCtrl.style.display = "inherit";

    if (type == "car" && !mapRouteCtrl)
    {
        map.addControl(directions, 'top-left');
    }
    else if (type == null)
    {
        saveRoute();
    }
}