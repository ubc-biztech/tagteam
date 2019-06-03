console.log('starting function');

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
const request = require('request');


exports.handler = function (data, ctx, callback) {

    // Slack will send a challenge when first installing the app to workspace
    if (data.challenge != null)
        callback(null, data.challenge);
        
    var text = data.event.text;
    
    var dm_user = data.event.user;
    
    if (dm_user == 'UJUHA7YQL')
        return;
        
    console.log(dm_user);
    var channel_to_reply = data.event.channel;

    // if no command entered (only user tags), display help info
    if (text.replace(/ *\<\@\w*\> */g, "") == "") {
        console.log("output help info");
        return;
    }

    var args = text.split(" ");

    var cmd = args[1];
    var team = args[2];

    console.log("cmd: " + cmd);
    console.log("team: " + team);
    
    

    if (cmd == "tag") {
        
        var params = {
            Key: {
                teams: team
            },
          TableName: 'tagTeam-api'
        };
        
        dynamodb.get(params, function(err, data) {
            if (err) console.log(err)
            else {
                
                // Team not found
                if (data.Item == undefined){
                    message('Team ' + team + ' not found', channel_to_reply);
                }
                else {
                    
                    var found = data.Item.text;
                    message(found, channel_to_reply);
                    
                }
            }
            
        })
    }

    else if (cmd == "add") {
        var users = text.match(/ *\<\@\w*\> */g);
        users.shift();
        console.log("users: ", users);
        
        var params = {
            Key: {
                teams: team
            },
          TableName: 'tagTeam-api'
        };
        
        dynamodb.get(params, function(err, data) {
            if (err) console.log(err)
            else {
                
                // Team not found
                if (data.Item == undefined){
                    message('Team ' + team + ' is now:' + users.join(), dm_user);
                    save(team, users.join());
                }
                else {
                    
                    var found = data.Item.text;
                    var toAdd = '';
                    
                    for (var i = 0; i < users.length; i++) {
                        if (!found.includes(users[i]) && !toAdd.includes(users[i])){
                            toAdd += users[i];
                        }
                    }
                    
                    message('Team ' + team + ' is now:' + found + toAdd, dm_user);
                    save(team, found + toAdd);
                }
            }
            
        })
    }

    else if (cmd == "clear") {
        clear(team);
    }
    
    else if (cmd == "remove") {
        var users = text.match(/ *\<\@\w*\> */g);
        users.shift();
        console.log("users: ", users);
        
        var params = {
            Key: {
                teams: team
            },
          TableName: 'tagTeam-api'
        };
        
        dynamodb.get(params, function(err, data) {
            if (err) console.log(err)
            else {
                
                // Team not found
                if (data.Item == undefined){
                    message('Team ' + team + ' not found', dm_user);
                }
                else {
                    
                    var found = data.Item.text;
                    
                    for (var i = 0; i < users.length; i++) {
                        found = found.replace(users[i], '')
                    }
                    
                    if (found == ''){
                        message('Team ' + team + ' is now empty and has been deleted', dm_user);
                        clear(team);
                    }
                    else {
                        message('Team ' + team + ' is now:' + found, dm_user);
                        save(team, found);
                    }
                    
                }
            }
            
        })
        
    }
};

function save(team, text) {

    var params = {
        Item: {
            teams: team,
            text: text
        },

        TableName: 'tagTeam-api'
    }

    dynamodb.put(params, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log('save succeeded');
        }
    });
}

function clear(team) {
    
    var params = {
        Key: {
            teams: team
        },

        TableName: 'tagTeam-api'
    }
    
    dynamodb.delete(params, function(err, data) {
       if (err) console.log(err);  // an error occurred
      else     console.log(data);  // successful response
    })
}

function message(text, channel) {
    
    var req = {
        url: 'https://slack.com/api/chat.postMessage',
        form: {
            token: process.env.BOT_TOKEN,
            channel: channel,
            text: text,
        },
        method: 'POST'
    }
    request(req, function(err, res, body){
       console.log(err)
       console.log(body)
    });
}
