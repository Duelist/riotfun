
module.exports = function () {
  var request = require('request'),
      async = require('async'),
      region = process.env.RIOT_REGION,
      api_key = process.env.RIOT_API_KEY;

  function create_response(data, code, message) {
    data = data || {};
    code = code || 200;
    message = message || 'OK';

    return {
      meta: {
        code: code,
        message: message
      },
      result: data
    }
  }

  return {
    last_game_kda: function (summoner_name, callback) {
      var summoner_name_options = {
        url: 'https://na.api.pvp.net/api/lol/' +
          region + 
          '/v1.4/summoner/by-name/' +
          summoner_name +
          '?api_key=' +
          api_key
      };

      request.get(summoner_name_options, function (error, response, body) {
        var json_body,
            recent_games_options,
            champ_json_body,
            recentChampion;

        if (!error && response.statusCode === 200) {
          json_body = JSON.parse(body);
          recent_games_options = {
            url: 'https://na.api.pvp.net/api/lol/' +
              region +
              '/v1.3/game/by-summoner/' +
              json_body[summoner_name]['id'] +
              '/recent?api_key=' + 
              api_key
          };

          request.get(recent_games_options, function (error, response, body) {
            var most_recent_game,
                json_body = JSON.parse(body),
                games_list = json_body.games,
                wonStr = "won";

            games_list = games_list.sort(function (a, b) {
              return a.create_date > b.create_date;
            });

            most_recent_game = games_list[0];
            if (!most_recent_game.stats.win){
              wonStr = "lost";
            }
			
            recent_champion_options = {
              url: 'https://na.api.pvp.net/api/lol/static-data/' +
                region +
                '/v1.2/champion/' +
                most_recent_game.championId +
                '?api_key=' +
                api_key
            };

            request.get(recent_champion_options, function (error, response, body){
              var champ_json_body = JSON.parse(body);

              return callback(create_response({
                'summoner_id': json_body.summonerId,
                'summoner_name': summoner_name,
                'kills': most_recent_game.stats.championsKilled || 0,
                'deaths': most_recent_game.stats.numDeaths || 0,
                'assists': most_recent_game.stats.assists || 0,
                'won': wonStr,
                'champ_name': champ_json_body.name
              }));
            });
          });
        } else {
          return callback(create_response(null, 404, 'Summoner not found.'));
        }
      });
    }
    , champion_summon: function (champion_name, callback) {
      var championOptions = {
        url: "https://dl.dropboxusercontent.com/u/19958428/" + champion_name +".png"
      };
      request.get(championOptions, function (error, response, body){
        if (!error && response.statusCode === 200){
          return callback(create_response({
            'champ_name': champion_name
          }));
        }
        else {
          return callback(create_response(null, 404, 'Champion not found.'));
        }
      });
    }
  }
}();

