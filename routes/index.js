const express = require("express");
const router = express.Router();
const util = require("util");

router.get("/", (req, res, next) => {

    req.query.displayName = req.user == null ? null : req.user.email;
    res.render("index", req.query);
});

module.exports = router;