var express = require('express'),
    router = express.Router(),
    app = express();

router.get('/', function (request, response) {
  response.sendStatus(200);
});
 
router.post('/', function (request, response) {
  console.log('hi');
});
 
app.use('/', router);
 
app.listen(80);
