var express = require('express'),
    request = require('request'),
    rito_pls = require('./modules/rito_pls'),
    router = express.Router(),
    app = express();

app.set('port', (process.env.PORT || 5000));

router.get('/', function (req, res) {
  rito_pls.last_game_kda('duelistxi',console.log); 
  res.sendStatus(200);
});
 
router.post('/', function (req, res) {
  console.log(req.query);
  console.log(req.params);
  rito_pls.last_game_kda('duelistxi', function (data) {
    var options = {
      url: process.env.POST_ENDPOINT
    };

    if (data.meta.code === 200) {
      options.body = '{ "text": "' +
        data.result.summoner_name +
        ' had a KDA of ' +
        data.result.kills + ' / ' +
        data.result.deaths + ' / ' +
        data.result.assists +
        ' last game." }';
    } else {
      options.body = data.meta.message;
    }

    request.post(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('Successful POST.');
      }
    });
  });
});
 
app.use('/', router);
 
app.listen(app.get('port'));
