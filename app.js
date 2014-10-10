var express = require('express'),
    request = require('request'),
    rito_pls = require('./modules/rito_pls'),
    router = express.Router(),
    app = express();

app.set('port', (process.env.PORT || 5000));

router.get('/', function (req, res) {
  res.sendStatus(200);
});
 
router.post('/', function (req, res) {
  rito_pls.last_game_kda('45436672', function (result) {
    var options = {
      url: process.env.POST_ENDPOINT,
      body: '{ "text": "' +
        result.summoner_name +
        ' had a KDA of ' +
        result.kills + ' / ' +
        result.deaths + ' / ' +
        result.assists + ' last game." }'
    };

    request.post(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('Successful POST.');
      }
    });
  });
});
 
app.use('/', router);
 
app.listen(app.get('port'));
