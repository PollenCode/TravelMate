var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "8vyD3SR=_uGa5!s*jcXTbFzaV",
  database: "travelmate"
});

/* OBSOLETE
function createUserFromRow(sqlResults)
{
    var userObject = {};
    for(var v in sqlResults[0])
        userObject[v] = sqlResults[0][v];
    return userObject;
}*/

module.exports.getIncomingConnections = function(userId, success, error) 
{
    if (!userId)
        return error(new Error("getIncomingConnections: userId is null."));

    connection.query("SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user1 = users.id AND connections.user2 = ? AND connections.status = 0)", [userId], (err, results, fields) => {
        if (err)
            return error(err);
        
        success(results);
    });
};

module.exports.getPendingConnections = function(userId, success, error) 
{
    if (!userId)
        return error(new Error("getPendingConnections: userId is null."));

    connection.query("SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user2 = users.id AND connections.user1 = ? AND connections.status = 0)", [userId], (err, results, fields) => {
        if (err)
            return error(err);

        success(results);
    });
};

module.exports.getConnections = function(userId, success, error) 
{
    if (!userId)
        return error(new Error("getConnections: userId is null."));

    connection.query("SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user1 = users.id AND connections.user2 = ? AND connections.status = 1) OR (connections.user2 = users.id AND connections.user1 = ? AND connections.status = 1)", [userId, userId], (err, results, fields) => {
        if (err)
            return error(err);

        success(results);
    });
};

module.exports.acceptConnection = function(connectionId, success, error)
{
    if (!connectionId)
        return error(new Error("connectionId is null."));

    connection.query("UPDATE connections SET status = 1 WHERE id = ? AND status = 0", [connectionId], (err, results, fields) => {
        if (err)
            return error(err);
        if (results.affectedRows == 0)
            return error(new Error("No connection was accepted."));

        success(true);
    });
};

module.exports.isConnectionMade = function(user1Id, user2Id, success, error)
{
    if (!user1Id || !user2Id)
        return error(new Error("isConnectionMade: user1Id or user2Id is null."));

    connection.query("SELECT id FROM connections WHERE (connections.user2 = ? AND connections.user1 = ?) OR (connections.user1 = ? AND connections.user2 = ?)", [user1Id, user2Id, user1Id, user2Id], (err, results, fields) => {
        if (err)
            return error(err);

        success(results.length > 0);
    });
};

module.exports.createConnection = function(creatorUserId, betweenUserId, success, error)
{
    if (!creatorUserId || !betweenUserId)
        return error(new Error("createConnection: creatorUserId or betweenUserIdis null."));
    else if (creatorUserId == betweenUserId)
        return error(new Error("It is not allowed to create a friend connection between me and myself."));

    module.exports.isConnectionMade(creatorUserId, betweenUserId, (data) => {

        if (data)
            return success(data);

        connection.query("INSERT INTO connections(user1,user2) VALUES(?,?)", [creatorUserId, betweenUserId], (err, results, fields) => {
            if (err)
                return error(err);
            if (results.affectedRows == 0)
                return error(new Error("No connection was made."));
    
            success(true);
        });

    }, (err) => {
        return error(err);
    });
};

module.exports.breakConnection = function(connectionId, success, error)
{
    if (!connectionId)
        return error(new Error("Cannot break a null connection."));

    connection.query("DELETE FROM connections WHERE id = ?", [connectionId], (err, results, fields) => {
        if (err)
            return error(err);
        if (results.affectedRows == 0)
            return error(new Error("No connection was broken."));
            
        success(true);
    });
}

module.exports.getUserWithId = function(id, success, error)
{
    if (!id)
        return error(new Error("No id was specified."));

    connection.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id], (err, results, fields) => {
        if (err)
            return error(err);
        if (results.length == 0)
            return error(new Error("User not found."));

        success(results[0]);
    });
}

module.exports.getUserWithEmail = function(email, success, error)
{
    if (!email)
        return error(new Error("No email was specified."));

    connection.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], (err, results, fields) => {
        if (err)
            return error(err);
        if (results.length == 0)
            return error(new Error("User not found."));

        success(results[0]);
    });
}

module.exports.getAllConnections = function(userId, success, error)
{
    module.exports.getIncomingConnections(userId, (incoming) => {
        module.exports.getPendingConnections(userId, (pending) => {
            module.exports.getConnections(userId, (connections) => {
                success(incoming, pending, connections);
            }, (err) => {
                return error(err);
            })
        }, (err) => {
            return error(err);
        })
    }, (err) => {
        return error(err);
    })
}

// Accept friend incoming friend request
// UPDATE connections SET status = 1 WHERE (id = ?)

// Check if connections is made
// SELECT id FROM connections WHERE (connections.user2 = 8 AND connections.user1 = 7) OR (connections.user1 = 8 AND connections.user2 = 7)

// Create connection
// INSERT INTO connections(user1,user2) VALUES(7,8)

// Get all incoming friends, user1 is connection maker
// SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user1 = users.id AND connections.user2 = 7 AND connections.status = 0)

// Get all pending friends, user1 is connection maker
// SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user2 = users.id AND connections.user1 = 7 AND connections.status = 0)

// Get all accepted friends for user with id 7 
// SELECT users.id,users.email,users.firstName,users.lastName,users.dateOfBirth,users.dateOfRegister,connections.id,connections.user1,connections.user2 FROM users INNER JOIN connections ON (connections.user1 = users.id AND connections.user2 = 7 AND connections.status = 1) OR (connections.user2 = users.id AND connections.user1 = 7 AND connections.status = 1)