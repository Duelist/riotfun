var express = require('express'),
    router = express.Router(),
    app = express();

app.set('port', (process.env.PORT || 5000));

router.get('/', function (request, response) {
  response.sendStatus(200);
});
 
router.post('/', function (request, response) {
  console.log('hi');
});
 
app.use('/', router);
 
app.listen(app.get('port'));
