const express = require("express");
const router = express.Router();
const salter = require("../salter");
const passport = require("passport");
const util = require("util");
const moment = require("moment");
const bcrypt = require("bcrypt");
const query = require("../query");

var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "8vyD3SR=_uGa5!s*jcXTbFzaV",
  database: "travelmate"
});
 
router.post("/register", (req, res, next) => {
    req.errorPage = "register";

    console.log("req.body:" + util.inspect(req.body));

    var errorMessages = [];
    var problems = [];

    if (!req.body.firstName)
    {
        problems.push("firstName");
        errorMessages.push("Please fill in your first name.");
    }
    if (!req.body.lastName)
    {
        problems.push("lastName");
        errorMessages.push("Please fill in your last name.");
    }
    if (!req.body.password || req.body.password != req.body.passwordCheck)
    {
        problems.push("password");
        problems.push("passwordCheck");
        errorMessages.push("The password check does not match your original password.");
    }
    if (!req.body.dateOfBirth || !moment(req.body).isValid() || moment(req.body).isAfter(moment())) 
    {
        problems.push("dateOfBirth");
        errorMessages.push("The date of birth is not valid.");
    }
    if (!req.body.email || !req.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm))
    {
        problems.push("email");
        errorMessages.push("Please enter a valid email address.");
    }
    if (problems.length > 0 || errorMessages.length > 0)
    {
        req.renderOptions.problems = problems;
        var allMessages = " - " + errorMessages.join("<br> - ");
        return next(new Error(allMessages));
    }

    passport.authenticate("localRegister", {
        successRedirect: req.queryRedirect || "/map"
    })(req, res, next);
});

router.post("/login", (req, res, next) => {
    req.errorPage = "login";

    passport.authenticate("localLogin", {
        successRedirect: req.queryRedirect || "/map"
    })(req, res, next);
});

router.get("/me", (req, res, next) => {
    if (req.user == null)
    {
        res.json({
            status: "failed",
            message: "User is not logged in."
        });
    }
    else
    {
        res.json({
            status: "ok",
            user: req.user
        });
    }
});

router.post("/removeFriend", (req, res, next) => {
  //TODO
});

router.post("/acceptFriend", (req, res, next) => {
  //TODO
});

router.post("/addFriend", (req, res, next) => {

    req.errorPage = "friends";

    var friendEmail = req.body.friendEmail;
    if (!friendEmail)
        return next(new Error("Email missing: No valid friend email was specified."));

    query.getAllConnections(req.user.id, (incoming, pending, connections) => {
        req.renderOptions.incomingFriendRequests = incoming;
        req.renderOptions.pendingFriendRequests = pending;
        req.renderOptions.friends = connections;
        query.getUserWithEmail(friendEmail, (friendUser) => {
            query.createConnection(req.user.id, friendUser.id, (result) => {
                res.render("friends", req.renderOptions);
            }, (err) => {
                return next(err);
            });
        }, (err) => {
            return next(new Error("Not found: Nobody with that email was found."));
        });
    }, (err) => {
        return next(err);
    });
});

router.get("/friends", (req, res, next) => {
  
    query.getAllConnections(req.user.id, (incoming, pending, connections) => {
        req.renderOptions.incomingFriendRequests = incoming;
        req.renderOptions.pendingFriendRequests = pending;
        req.renderOptions.friends = connections;
        res.render("friends", req.renderOptions);
    }, (err) => {
        return next(err);
    });

});

/* OBSOLETE
function setFriendListRenderOptions(req, res, next, callback)
{
    var pendingFriendRequests = [];
    var incomingFriendRequests = [];
    var friends = req.user.friendIds;

    if (connection.query("SELECT * FROM friend_requests WHERE receiverId = ? LIMIT 100", [req.user.id], (error, results, fields) => {

        if (error)
            return next(error);
        if (results.length != 0)            
            req.renderOptions.errorMessage = "You have " + results.length + " incoming friend requests.";

        for(var i = 0; i < results.length; i++)
            incomingFriendRequests.push(results[i].senderEmail);
       
        if (connection.query("SELECT * FROM friend_requests WHERE senderId = ? LIMIT 100", [req.user.id], (error, results2, fields) => {

            if (error)
                return next(error);
    
            for(var i = 0; i < results2.length; i++)
                pendingFriendRequests.push(results2[i].receiverEmail);
            
            if (connection.query("SELECT * FROM users WHERE id IN (?)", [req.user.friendIds], (error, results3, fields) => {

                if (error)
                    return next(error);
        
                for(var i = 0; i < results3.length; i++)
                    friends.push(createUserFromRow(results3[i]));

                    // Finally render the friend list
                    req.renderOptions.pendingFriendRequests = pendingFriendRequests;
                    req.renderOptions.incomingFriendRequests = incomingFriendRequests;
                    req.renderOptions.friends = friends;

                    callback();
            }));
        }));
    }));
}*/

router.get("/logout", (req, res, next) => {
    req.logout();

    if (req.queryRedirect)
    {
        res.redirect(req.queryRedirect);
    }
    else
    {
        res.json({
            status: "ok",
            message: "User is now logged out."
        });
    }
});

module.exports = router;