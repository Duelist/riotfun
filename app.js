var express = require('express'),
    settings = require('./settings.json'),
    router = express.Router(),
    app = express();

app.set('port', (process.env.PORT || 5000));

router.get('/', function (req, res) {
  res.sendStatus(200);
});
 
router.post('/', function (req, res) {
  var options = {
    url: settings['post_endpoint'],
    body: '{ "text": "Vayne is the best ADC ever." }'
  };

  req.post(options, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('Successful POST.');
    }
  });
});
 
app.use('/', router);
 
app.listen(app.get('port'));
