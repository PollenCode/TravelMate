const request = require("request");

const delijnApiKey = "2a64f6a71f1f406bb38bc3c7871594c7";


// Krijg provincies: https://api.delijn.be/DLKernOpenData/api/v1/entiteiten
// Krijg gemeentes in provincie: https://api.delijn.be/DLKernOpenData/api/v1/entiteiten/{provincienum}/gemeenten

request("https://api.delijn.be/DLKernOpenData/api/v1/entiteiten/2/gemeenten", { 
    json: true, 
    headers: {
        "Ocp-Apim-Subscription-Key": delijnApiKey
    }
}, (err, res, body) => {
    if (err) { 
        return console.log(err); 
    }

    for(var i = 0; i < body.gemeenten.length; i++)
    {
        console.log("gemeente " + body.gemeenten[i].omschrijving);
    }

    /*fs.writeFileSync("output.json", util.inspect(body));
    console.log("file written");
*/
    //console.log(body);
});