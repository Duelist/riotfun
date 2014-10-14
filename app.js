var express = require('express'),
    request = require('request'),
    body_parser = require('body-parser'),
    rito_pls = require('./modules/rito_pls'),
    router = express.Router(),
    app = express();

app.set('port', (process.env.PORT || 5000));

app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());

router.get('/', function (req, res) {
  rito_pls.last_game_kda('duelistxi',console.log); 
  res.sendStatus(200);
});
 
router.post('/', function (req, res) {
  var tokens = req.body.text.split(' '),
    command = tokens[1] || 'rkda';
    param = tokens[2] || 'duelistxi';
  for (var i = 3; i < tokens.length; i++){
    param += " " + tokens[i];
  }  
  if (command == "rkda"){
    rito_pls.last_game_kda(param, function (data) {
      var options = {
        url: process.env.POST_ENDPOINT
      };

      if (data.meta.code === 200) {
        options.body = create_slack_message(
          ['#', req.body.channel_name].join(''),
          ["https://dl.dropboxusercontent.com/u/19958428/", data.result.champ_name.replace(/ /g, "%20"),".png"].join(''),
          [data.result.champ_name, ' says: '].join(''),
          [
            '@', req.body.user_name, ': ',
            data.result.summoner_name,
            ' we ',
            data.result.won, ' the last game with a KDA of ',
            data.result.kills, ' / ',
            data.result.deaths, ' / ',
            data.result.assists,
            '.'
          ].join('')
        );
      } else {
        options.body = create_slack_message(
          ['#', req.body.channel_name].join(''),
          '',
          '',
          [
            '@', req.body.user_name, ': ',
            data.meta.message
          ].join('')
        );
      }

      options.body = JSON.stringify(options.body);

      request.post(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          console.log('[INFO] Successful POST.');
          res.sendStatus(200);
        }
      });
    });
  }
  else if (command == "summon"){
    rito_pls.champion_summon(param, function(data){
      var options = {
        url: process.env.POST_ENDPOINT
      };
    
      if (data.meta.code === 200) {
          options.body = create_slack_message(
            ['#', req.body.channel_name].join(''),
            ["https://dl.dropboxusercontent.com/u/19958428/", data.result.champ_name.replace(/ /g, "%20"),".png"].join(''),
            [data.result.champ_name, ' says: '].join(''),
            [
              '@', req.body.user_name, ': ',
              ' You called? ',
            ].join('')
          );
        } 
      else {
        options.body = create_slack_message(
          ['#', req.body.channel_name].join(''),
          '',
          '',
          [
            '@', req.body.user_name, ': ',
            data.meta.message
          ].join('')
        );
      }

      options.body = JSON.stringify(options.body);

      request.post(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          console.log('[INFO] Successful POST.');
          res.sendStatus(200);
        }
      });
    });
  }
  else {
  }
});

function create_slack_message(channel, icon_url, username, text) {
  channel = channel || '';
  icon_url = icon_url || '';
  username = username || '';
  text = text || '';

  return {
    channel: channel,
    username: username,
    icon_url: icon_url,
    text: text
  };
}

app.use('/', router);
 
app.listen(app.get('port'));
