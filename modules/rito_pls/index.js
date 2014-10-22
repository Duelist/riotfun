
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
  
  function convertGameType(type){
    var typeRet = "";
    if (type.indexOf("RANKED") > -1) {
      typeRet = "ranked";
    }
    else if (type.indexOf("NORMAL") > -1){
      typeRet = "normal";
    }
    else {
      if (type != "undefined"){
        typeRet = type.toLowerCase();
      }
    }
    return typeRet;
  }

  return {
    last_game_kda: function (summoner_name, callback) {
      var tokens = summoner_name.split(' ');
      if (tokens.length === 1){
        var summoner_name_options = {
          url: 'https://na.api.pvp.net/api/lol/' +
            region + 
            '/v1.4/summoner/by-name/' +
            summoner_name.toLowerCase() +
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
                json_body[summoner_name.toLowerCase()]['id'] +
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
        
              var recent_champion_options = {
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
                  'gameType': convertGameType(most_recent_game.subType),
                  'won': wonStr,
                  'champ_name': champ_json_body.name,
                  'remain_champ_name': ''
                }));
              });
            });
          } else {
            return callback(create_response(null, 404, 'Summoner not found.'));
          }
        });
      }
      else {
        var nameString = tokens[0].toLowerCase();
        for (var i = 1; i < tokens.length; i++){
          nameString += "," + tokens[i].toLowerCase();
        }
        var summoner_name_options = {
          url: 'https://na.api.pvp.net/api/lol/' +
            region + 
            '/v1.4/summoner/by-name/' +
            nameString +
            '?api_key=' +
            api_key
        };
        
        request.get(summoner_name_options, function (error, response, body) {
          var json_body,
            recent_games_options,
            champ_json_body,
            recentChampion;
          if (!error && response.statusCode === 200) {
            var summonerId = [];
            json_body = JSON.parse(body);
            for (var i = 0; i < tokens.length; i++){
              summonerId[i] = json_body[tokens[i].toLowerCase()]['id'];
            }
            var completedRequests = 0;
            var mostRecentGameList = [];
            for (var t = 0; t < tokens.length; t++){
              recent_games_options = {
                url: 'https://na.api.pvp.net/api/lol/' +
                  region +
                  '/v1.3/game/by-summoner/' +
                  json_body[tokens[t].toLowerCase()]['id'] +
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
                
                most_recent_game = -1;
                matchedChampionIds = [most_recent_game.championId];
                for (var i = 0; i < games_list.length; i++){
                  var fellowPlayers = games_list[i].fellowPlayers;
                  for (var j = 0; j < summonerId.length; j++){
                    var matchedPlayers = [tokens[t]];
                    for (var k = 0; k < fellowPlayers.length; k++){
                      if (summonerId[j] === fellowPlayers[k]['summonerId']){
                        matchedPlayers.push(summonerId[j]);
                        matchedChampionIds.push(fellowPlayers[k]['championId']);
                      }
                    }
                    if (matchedPlayers.length === summonerId.length){
                      most_recent_game = games_list[i];
                      break;
                    }
                  }
                  if (most_recent_game !== -1){
                    break;
                  }
                }
                if (most_recent_game !== -1){
                  mostRecentGameList.push(most_recent_game);
                }
                // Async handlings
                completedRequests += 1;
                if (completedRequests === tokens.length){
                  if (mostRecentGameList[0] === undefined){
                    return callback(create_response(null, 404, 'No recent games found shared by Summoner(s)'));
                  }
                  else {
                    mostRecentGameList = mostRecentGameList.sort(function (a, b) {
                      return a.create_date > b.create_date;
                    });
                    most_recent_game = mostRecentGameList[0];
                    if (!most_recent_game.stats.win){
                      wonStr = "lost";
                    }
                    
                    var mainChamp = "";
                    var remainingChamps = [];
                    var fellowStr = "";
                    for (var i = 0; i < tokens.length; i++){
                      if (fellowStr === ""){
                        fellowStr += tokens[i];
                      }
                      else {
                        fellowStr += ", " + tokens[i];
                      }
                    }
                    //for (var z = 0; z < matchedChampionIds.length; z++){
                      var recent_champion_options = {
                        url: 'https://na.api.pvp.net/api/lol/static-data/' +
                          region +
                          '/v1.2/champion/' +
                          matchedChampionIds[0] +
                          '?api_key=' +
                          api_key
                      };
                      var completed_champ_requests = 0;
                      request.get(recent_champion_options, function (error, response, body){
                        var champ_json_body = JSON.parse(body);
                        if (completed_champ_requests === 0){
                          completed_champ_requests += 1;
                          mainChamp = champ_json_body.name;
                        }else {
                          completed_champ_requests += 1;
                          remainingChamps.push(champ_json_body.name);
                        }
                        //if(completed_champ_requests === tokens.length){
                          var remainChamp = "";
                          /*for (var i = 0; i < remainingChamps.length; i++){
                            if (remainChamp === ""){
                              remainChamp += ' with ' + remainingChamps[i];
                            }
                            else {
                              remainChamp += ", " + remainingChamps[i];
                            }
                          }*/
                        
                          return callback(create_response({
                            'summoner_id': json_body.summonerId,
                            'summoner_name': fellowStr,
                            'kills': most_recent_game.stats.championsKilled || 0,
                            'deaths': most_recent_game.stats.numDeaths || 0,
                            'assists': most_recent_game.stats.assists || 0,
                            'gameType': convertGameType(most_recent_game.subType),
                            'won': wonStr,
                            'champ_name': mainChamp,
                            'remain_champ_name': remainChamp
                          }));
                       // }
                      });
                    //}
                  }
                }
              });
            }
          } else {
            return callback(create_response(null, 404, 'Summoner(s) not found.'));
          }  
        });
      }
    }
    , champion_summon: function (champion_name, callback) {
      var championOptions = {
        url: "https://dl.dropboxusercontent.com/u/19958428/" + champion_name.replace(/ /g, "%20") +".png"
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

