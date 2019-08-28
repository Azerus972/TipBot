'use strict';

// Load up libraries
const Discord = require('discord.js');
let moment = require('moment-timezone');
// Load config!
let config = require('config');
let logChannel = config.get('moderation').logchannel;
let pm2Name = config.get('moderation').pm2Name;
config = config.get('bot');
const talkedRecently = new Set();
var aliases;
// check if any aliases are defined
try {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  aliases = require('./alias.json');
  console.log('[' + time + ' PST][' + pm2Name + '] ' + Object.keys(aliases).length + ' aliases Loaded!');
} catch (e) {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log('[' + time + ' PST][' + pm2Name + '] No aliases defined');
}
var commands = {};

var bot = new Discord.Client();

bot.on('ready', function() {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log(
    '[' +
      time +
      ' PST][' +
      pm2Name +
      '] ' +
      bot.user.username +
      'Logged in! Serving in ' +
      bot.guilds.array().length +
      ' servers'
  );
// bot.channels
//     .get(logChannel)
//     .send(
//       '[' +
//         time +
//         ' PST][' +
//         pm2Name +
//         '] ' +
//         bot.user.username +
//         'Logged in! Serving in ' +
//         bot.guilds.array().length +
//         ' servers'
//     );
  require('./plugins.js').init();
  console.log(
    '[' +
      time +
      ' PST][' +
      pm2Name +
      '] type ' +
      config.prefix +
      'help in Discord for a commands list.'
  );
  // bot.channels
  //   .get(logChannel)
  //   .send(
  //     '[' +
  //       time +
  //       ' PST][' +
  //       pm2Name +
  //       '] type ' +
  //       config.prefix +
  //       'help in Discord for a commands list.'
  //   );
  bot.user.setActivity(config.prefix + 'Intialized!');
  var text = ['mynt', 'help', 'invite'];
  var counter = 0;
  setInterval(change, 10000);

  function change() {
    bot.user.setActivity(config.prefix + text[counter]);
    counter++;
    if (counter >= text.length) {
      counter = 0;
    }
  }
});

process.on('uncaughtException', err => {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log('[' + time + ' PST][' + pm2Name + '] uncaughtException: ' + err);
  bot.channels
    .get(logChannel)
    .send('[' + time + ' PST][' + pm2Name + '] uncaughtException: ' + err);
  //process.exit(1); //exit node.js with an error
});

process.on('unhandledRejection', err => {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log('[' + time + ' PST][' + pm2Name + '] unhandledRejection: ' + err);
  bot.channels
    .get(logChannel)
    .send('[' + time + ' PST][' + pm2Name + '] unhandledRejection: ' + err);
  //process.exit(1); //exit node.js with an error
});

bot.on('disconnected', function() {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log('[' + time + ' PST][' + pm2Name + '] Disconnected!');
  //process.exit(1); //exit node.js with an error
});

bot.on('error', function(error) {
  var time = moment()
    .tz('America/New_York')
    .format('MM-DD-YYYY hh:mm a');
  console.log('[' + time + ' PST][' + pm2Name + '] error: ' + error);
  //process.exit(1); //exit node.js with an error
});

function checkMessageForCommand(msg, isEdit) {
  //check if message is a command
  if (msg.author.id != bot.user.id && msg.content.startsWith(config.prefix)) {
    if (talkedRecently.has(msg.author.id)) {
            msg.channel.send("Cooldown on all commands. Please wait 15 seconds before trying again. - " + msg.author);
    } else {
    //check if user is Online
      if (
        !msg.author.presence.status ||
        msg.author.presence.status == 'offline' ||
        msg.author.presence.status == 'invisible'
      ) {
        msg.author
          .send('Go online to talk to me!')
          .catch(function(error) {
            msg.channel
              .send(
                msg.author +
                  ', Please enable Direct Messages from server members to communicate fully with our bot, it is located in the user setting area under Privacy & Safety tab, select the option allow direct messages from server members'
              )
              .then(
                msg.channel.send(
                  'Go online to talk to me!'
                )
              );
            return;
          });
      }
      var cmdTxt = msg.content.split(' ')[0].substring(config.prefix.length);
      var suffix = msg.content.substring(
       cmdTxt.length + config.prefix.length + 1
      ); //add one for the ! and one for the space
      if (msg.isMentioned(bot.user)) {
        try {
          cmdTxt = msg.content.split(' ')[1];
          suffix = msg.content.substring(
            bot.user.mention().length + cmdTxt.length + config.prefix.length + 1
          );
        } catch (e) {
          //no command
          msg.channel.send('Yes?');
          return;
        }
      }
      let alias = aliases[cmdTxt];
      if (alias) {
        var cmd = commands[alias];
      } else {
        var cmd = commands[cmdTxt];
      }
      if (cmd) {
        // Add permission check here later on ;)
        console.log(
          'treating ' +
            msg.content +
            ' from ' +
            msg.author.username +
            ' as command'
        );
        try {
        cmd.process(bot, msg, suffix, isEdit);
      } catch (e) {
        var msgTxt = 'command ' + cmdTxt + ' failed :(';
        var linebreak = '\n-------------------------------------------------\n';
        if (config.debug) {
          msgTxt += '\n' + e.stack;
        }
        var time = moment()
          .tz('America/New_York')
          .format('MM-DD-YYYY hh:mm a');
        bot.channels
          .get(logChannel)
          .send('[' + time + ' PST][' + pm2Name + '] ' + msgTxt + linebreak);
      }
    }
      talkedRecently.add(msg.author.id);
          setTimeout(() => {
          // Removes the user from the set after a minute
          talkedRecently.delete(msg.author.id);
        //}, 15000);
        }, 1);
    }
  } else {
    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if (msg.author == bot.user) {
      return;
    }

    if (msg.author != bot.user && msg.isMentioned(bot.user)) {
      msg.channel.send('yes?'); //using a mention here can lead to looping
    } else {
  }
  }
}

bot.on('message', msg => checkMessageForCommand(msg, false));

exports.addCommand = function(commandName, commandObject) {
  try {
    commands[commandName] = commandObject;
  } catch (err) {
    var time = moment()
      .tz('America/New_York')
      .format('MM-DD-YYYY hh:mm a');
    console.log('[' + time + ' PST][' + pm2Name + '] Error addCommand: ' + err);
    bot.channels
      .get(logChannel)
      .send('[' + time + ' PST][' + pm2Name + '] Error addCommand: ' + err);
  }
};
exports.addCustomFunc = function(customFunc) {
  try {
    customFunc(bot);
  } catch (err) {
    var time = moment()
      .tz('America/New_York')
      .format('MM-DD-YYYY hh:mm a');
    console.log(
      '[' + time + ' PST][' + pm2Name + '] Error addCustomFunc: ' + err
    );
    bot.channels
      .get(logChannel)
      .send('[' + time + ' PST][' + pm2Name + '] Error addCustomFunc: ' + err);
  }
};
exports.commandCount = function() {
  return Object.keys(commands).length;
};

bot.login(config.token);
