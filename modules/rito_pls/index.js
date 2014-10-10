
module.exports = function () {
  var request = require('request'),
      async = require('async'),
      region = process.env.RIOT_REGION,
      api_key = process.env.RIOT_API_KEY;

  return {
    last_game_kda: function last_game_kda(summoner_id, callback) {
      var recent_games_options = {
            url: 'https://na.api.pvp.net/api/lol/' +
              region +
              '/v1.3/game/by-summoner/' +
              summoner_id +
              '/recent?api_key=' + 
              api_key
          },
          summoner_name_options = {
            url: 'https://na.api.pvp.net/api/lol/' +
              region + 
              '/v1.4/summoner/' +
              summoner_id +
              '/name?api_key=' +
              api_key
          };

      async.series([
        function (cb) {
          request.get(recent_games_options, function (error, response, body) {
            var most_recent_game,
                json_body = JSON.parse(body),
                games_list = json_body.games;

            games_list = games_list.sort(function (a, b) {
              return a.create_date > b.create_date;
            });

            most_recent_game = games_list[0];

            cb(null, {
              'summoner_id': json_body.summonerId,
              'kills': most_recent_game.stats.championsKilled,
              'deaths': most_recent_game.stats.numDeaths,
              'assists': most_recent_game.stats.assists,
              'won': most_recent_game.stats.win
            });
          })
        },
        function (cb) {
          request.get(summoner_name_options, function (error, response, body) {
            cb(null, JSON.parse(body));
          })
        }
      ], function (error, results) {
        return callback({
          'summoner_id': results[0].summoner_id,
          'summoner_name': results[1][results[0].summoner_id],
          'kills': results[0].kills,
          'deaths': results[0].deaths,
          'assists': results[0].assists,
          'won': results[0].won
        });
      });
    }
  };
}();

