var fs = require('fs');

var lijnColors = JSON.parse(fs.readFileSync('./tests/lijnkleuren.json', 'utf8'));
var newLijnColors = {};

for(var i = 0; i < lijnColors.kleuren.length; i++)
{
    var color = lijnColors.kleuren[i];
    console.log(color);
    newLijnColors[color.code] = color.hex;
}

console.log(JSON.stringify(newLijnColors));