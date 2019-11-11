const query = require("../query")
const util = require("util");

function successTest(name)
{
    return function(thing) 
    {
        console.log(name + " => success: " + util.inspect(thing));
    }
    
}
function errorTest(name)
{
    return function(thing) 
    {
        console.log(name + " => error: " + util.inspect(thing));
    }
}


var testUserId = 7;
query.getIncomingConnections(testUserId, successTest("getIncomingConnections"), errorTest("getIncomingConnections"));
query.getPendingConnections(9, successTest("getPendingConnections"), errorTest("getPendingConnections"));
query.getConnections(9, successTest("getConnections"), errorTest("getConnections"));
query.acceptConnection(9, successTest("acceptConnection"), errorTest("acceptConnection"));
query.isConnectionMade(11, testUserId, successTest("isConnectionMade"), errorTest("isConnectionMade"));
query.isConnectionMade(testUserId, 12, successTest("isConnectionMade"), errorTest("isConnectionMade"));
query.createConnection(9, testUserId, successTest("createConnection"), errorTest("createConnection"));
query.getUserWithId("test@gmail.com", successTest("getUserWithId"), errorTest("getUserWithId"));
query.getUserWithEmail(11, successTest("getUserWithEmail"), errorTest("getUserWithEmail"));