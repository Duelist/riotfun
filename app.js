var express = require('express'),
    router = express.Router(),
    app = express();
 
router.post('/', function (request, response) {
  console.log('hi');
});
 
app.use('/', router);
 
app.listen(3000);
