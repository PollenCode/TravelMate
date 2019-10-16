const express = require("express");
const router = express.Router();
const util = require("util");

router.get("/", (req, res, next) => {
    req.renderOptions.displayName = req.user == null ? null : req.user.firstName;
    res.render("index", req.renderOptions);
});

module.exports = router;