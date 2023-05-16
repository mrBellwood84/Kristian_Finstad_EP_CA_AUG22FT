const router = require('express').Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(200).json("I am ALIVE!");
});

module.exports = router;
