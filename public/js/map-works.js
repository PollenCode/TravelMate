$(() => {
    console.log("mapworks loaded. o/");

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

    getLocation((position) => {
        $.ajax({
            url: "https://api.delijn.be/DLKernOpenData/v1/beta/haltes/indebuurt/" + position.coords.latitude + "," + position.coords.longitude + "?1000",
            headers: {"Ocp-Apim-Subscription-Key": "2a64f6a71f1f406bb38bc3c7871594c7"},
            type: "GET",
            dataType: 'json',
            success: (result) => { 
    
                for(var i = 0; i < result.haltes.length; i++)
                {
                    console.log(result.haltes[i].id + ": " + result.haltes[i].naam);

                    var el = document.createElement('div');
                    el.innerText = result.haltes[i].naam;
                    el.className = 'marker';

                    var lngLat = result.haltes[i].geoCoordinaat;

                    // make a marker for each feature and add to the map
                    new mapboxgl.Marker(el)
                        .setLngLat({lng: lngLat.longitude, lat: lngLat.latitude})
                        .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
                        .setHTML("id: " + result.haltes[i].id))
                        .addTo(map)
                 
                }
    
               // console.log("result: " +  JSON.stringify(result));
            },
            error: (error) => {
                console.log("error: " +  JSON.stringify(error));
            }
         });
    });

   
});

