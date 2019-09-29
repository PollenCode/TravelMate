const cmd = require("node-cmd");

cmd.get("git pull", (err, data, stderr) => console.log(data));