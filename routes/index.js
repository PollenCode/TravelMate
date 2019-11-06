const express = require("express");
const router = express.Router();
const util = require("util");

router.get("/", (req, res, next) => {
    if (req.user != null)
    {
        res.redirect("/map");
    }
    else
    {
        // req.renderOptions.displayName = req.user == null ? null : req.user.firstName;
        res.render("index", req.renderOptions);
    }
});

module.exports = router;