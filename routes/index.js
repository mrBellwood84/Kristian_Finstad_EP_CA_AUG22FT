const router = require('express').Router();

const jsend = require("jsend");

/* GET home page. */
router.get('/', jsend.middleware, function(req, res, next) {
  res.jsend.success({message: "I am alive"});
});

module.exports = router;
