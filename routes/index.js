const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (req, res, next) => {
    res.render("index", null);
});

module.exports = router;