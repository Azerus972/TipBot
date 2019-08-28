'use strict';
const bitcoin = require('bitcoin');
const Discord = require('discord.js');
let Regex = require('regex'),
  config = require('config'),
  spamchannels = config.get('moderation').botspamchannels,
  dev = config.get('moderation').botDev;
let walletConfig = config.get('mynt').config;
let paytxfee = config.get('mynt').paytxfee;
let prefix = config.get('bot').prefix;
const mynt = new bitcoin.Client(walletConfig);
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

exports.commands = ['mynt'];
exports.mynt = {
  usage: '<subcommand>',
  description:
    'MYNT',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsg =
        '```Mynt (MYNT) Payments\nTransaction Fees: ' + paytxfee + '\n!mynt : Displays This Message\n!mynt balance : get your balance\n!mynt deposit : get address for your deposits\n!mynt withdraw <ADDRESS> <AMOUNT> : withdraw coins to specified address\n!mynt block to get current block count\n!mynt supply to get current coin supply\n!mynt price to get the current price\n!mynt <@user> <amount> :mention a user with @ and then the amount to pay them\n!mynt private <user> <amount> : put private before Mentioning a user to pay them privately.\n\n<> : Replace with appropriate value.```',
      channelwarning = 'Please use private messaging or #bot-talk to talk to me or risk being kicked from the server...';
    switch (subcommand) {
      case 'help':
        privateorSpamChannel(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'tip':
        doTip(bot, msg, tipper, words, helpmsg);
        break;
      case 'balance':
        privateorSpamChannel(msg, channelwarning, doBalance, [tipper]);
        break;
      case 'deposit':
        privateorSpamChannel(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateorSpamChannel(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      case 'price':
        getPrice(bot, msg);
        break;
      case 'block':
        getBlock(bot, msg);
        break;
      case 'supply':
        getSupply(bot, msg);
        break;
      case 'soak':
        doSoakRainDrizzle(bot, msg, tipper, words, helpmsg, "soak");
        break;
      case 'rain':
        doSoakRainDrizzle(bot, msg, tipper, words, helpmsg, "rain");
        break;
      case 'drizzle':
        doSoakRainDrizzle(bot, msg, tipper, words, helpmsg, "drizzle");
        break;
      case 'btcprice':
        getBTCPrice(bot);
        break;
      default:
        doTip(bot, msg, tipper, words, helpmsg);
    }
  }
};
function privateorSpamChannel(message, wrongchannelmsg, fn, args) {
  if (!inPrivateorSpamChannel(message)) {
    message.reply(wrongchannelmsg).then(message => message.delete(10000));
    return;
  }
  fn.apply(null, [message, ...args]);
}
function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}

function doBalance(message, tipper) {
 mynt.getBalance(tipper, 1, function(err, balance) {
  var totalBalance = balance - paytxfee

    if (err) {
      message.reply('Error getting Mynt (MYNT) balance.').then(message => message.delete(10000));
    } else {
    message.channel.send({ embed: {
    title: '**Mynt (MYNT) Balance!**',
    color: 1363892,
    fields: [
      {
        name: '__User__',
        value: '<@' + message.author.id + '>',
        inline: false
      },
      {
        name: '__Balance__',
        //value: '**' + balance.toString() + '**',
        value: '**' + balance.toString() + '**',
        inline: false
      }
    ]
  } });
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your Mynt (MYNT) deposit address.').then(message => message.delete(10000));
    } else {
      message.channel.send({ embed: {
        title: '**Mynt (MYNT) Deposit!**',
        color: 1363892,
        fields: [
          {
            name: '__User__',
            value: '<@' + message.author.id + '>',
            inline: false
          },
          {
            name: '__Address__',
            value: '**' + address.toString() + '**',
            inline: false
          }
        ]
      } });

    }
  });
}
function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    doHelp(message, helpmsg);
    return;
  }
  var address = words[2],
    amount = getValidatedAmount(words[3]);
  if (amount === null) {
    message.reply("I don't know how to withdraw that much Mynt (MYNT)...").then(message => message.delete(10000));
    return;
  }
  mynt.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Mynt (MYNT) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Mynt (MYNT) for transaction fees!');
        return;
      }
      mynt.sendFrom(tipper, address, Number(amount), function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(10000));
        } else {
          message.reply('You withdrew ' + amount + ' MYNT to ' + address + '\n' + txLink(txId) + '\n');
      }
    });
    }
  });
}

function doTip(bot, message, tipper, words, helpmsg) {
  if (words.length < 3 || !words) {
    doHelp(message, helpmsg);
    return;
  }
  var prv = false;
  var amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }
  let amount = getValidatedAmount(words[amountOffset]);
  if (amount === null) {
    message.reply("I don't know how to tip that much Mynt (MYNT)...").then(message => message.delete(10000));
    return;
  }
  mynt.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting Mynt (MYNT) balance.').then(message => message.delete(10000));
    } else {
      if (Number(amount) + Number(paytxfee) > Number(balance)) {
        message.channel.send('Please leave atleast ' + paytxfee + ' Mynt (MYNT) for transaction fees!');
        return;
      }
      if (!message.mentions.users.first()){
           message
            .reply('Sorry, I could not find a user in your tip...')
            .then(message => message.delete(10000));
            return;
          }
      if (message.mentions.users.first().id) {
        sendMYNT(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
      } else {
        message.reply('Sorry, I could not find a user in your tip...').then(message => message.delete(10000));
      }
    }
  });
}

function doSoakRainDrizzle(bot, message, tipper, words, helpmsg, tipType) {
  if (words.length < 3 || !words) {
    doHelp(message, helpmsg);
    return;
  }
  var prv = false;
  var amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
      prv = true;
      amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    message.reply("I don't know how to tip that many coins...").then(message => message.delete(5000));
    return;
  } else if (amount < 1){
    message.reply("At least 100 coins are required to rain").then(message => message.delete(5000));
    return;
  }

  mynt.getBalance(tipper, function(err, balance){
    if(amount < balance){
      let serverid = message.channel.guild.id;
      let members = bot.guilds.get(serverid).members;
      let online = [];
      members.filter(m => {
        if(m.user.presence.status === 'online' && m.user.bot === false && tipper !== m.user.id){
          online.push(m.user);
        }
      });

      if(tipType === "soak") {
        soak(amount, online, onlineUserResponse);
      } else if(tipType === "rain"){
        rain(amount, online, message, onlineUserResponse);
      } else if (tipType === "drizzle"){
        drizzle(amount, online, message, onlineUserResponse);
      }
    } else {
      message.reply("Account has insufficient funds").then(message => message.delete(5000));
    }
    function onlineUserResponse(onlineID, noUserMessage, tippedMessage, setUsernames){
        let shareAmount = amount/onlineID.length;
        if(!onlineID.length){
        message.reply(noUserMessage);
      } else {
        let addresses = {}, i=0;
        onlineID.forEach(function(id){
          getAddress(id, function(err, address) {
            if (err) {
              message.reply("GET address Error: " +err.message).then(message => message.delete(5000));
            } else {
              i++;
              addresses[address] = shareAmount;
              if(onlineID.length === i || i % 100 === 0){
                  sendAll(tipper, addresses, tippedMessage, onlineID.length, i, setUsernames);
                  addresses = {};
              }
            }
          })
        });
      }
    }
    function sendAll (tipper, data, tippedMessage, tl, ind, setUsernames){
        mynt.sendMany(tipper, data, 2, 'Nemo From Example.com', function(res, tr){
            console.log(res);
            console.log(tr);
        });
        if(tl === ind){
          message.channel.send(tippedMessage);
          if(setUsernames && setUsernames.length > 1){
              for (let j = 1; j < setUsernames.length; j++) {
                  message.channel.send(setUsernames[j]);
              }
            // setUsernames.forEach(function(sun){
              // sendDSRMessages(message, tippedMessage + " " + sun, 0xFAA61B, []);
            // })
          }
          // else {
            // sendDSRMessages(message, tippedMessage, 0xFAA61B, []);
          // }
        }
    }
  });
}

function soak(amount, online, callback){
  let onlineID = [];
  let onlineUsername = "";
  let i=0;
  let setUsernames = [];
  online.forEach(function (user) {
      onlineID.push(user.id);
      onlineUsername = onlineUsername + " <@" + user.id + ">";
      i++;
      if(i === 50){
        setUsernames.push(onlineUsername);
        onlineUsername = "";
      }
  });
  setUsernames.push(onlineUsername);
  callback(onlineID, onlineID.length + " users currently online. No MYNT is rained",
      "MYNT soak initiated! \n**" +
      amount/onlineID.length + " MYNT each** soaked on " + setUsernames[0], setUsernames);
}

function rain(amount, online, message, callback){
  // users online && msg in last 10 minutes - limit to 5 users
  let onlineID = [];
  let onlineUsername = "";
  let currentTime = new Date().getTime();
  online.forEach(function (user) {
    if (!user.lastMessage) {
      const collector = new Discord.MessageCollector(message.channel, m => m.author.id === user.id, { time: 10000 });
      collector.on('collect', message => {
        if(message.channel.parentID === user.lastMessage.channel.parentID && currentTime - message.createdTimestamp < 180000) {
          onlineID.push(user.id);
          onlineUsername = onlineUsername + " <@" + user.id + ">"
        }
        collector.stop("Got my message");
      })
    } else {
      if(message.channel.parentID === user.lastMessage.channel.parentID && currentTime - message.createdTimestamp < 180000) {
        onlineID.push(user.id);
        onlineUsername = onlineUsername + " <@" + user.id + ">"
      }
    }
  });
  callback(onlineID, "No new messages, since I woke up", "MYNT rain initiated! \n" +
      "**" + amount/onlineID.length + " MYNT** rained down on " + onlineUsername + " :rocket:");
}

function drizzle(amount, online, message, callback){
  // users online && msg in last 10 minutes - limit to 5 users
  let onlineUsersList = [];
  let onlineUsername = "";
  let currentTime = new Date().getTime();
  online.forEach(function (user) {
    if (!user.lastMessage) {
      const collector = new Discord.MessageCollector(message.channel, m => m.author.id === user.id, { time: 10000 });
      collector.on('collect', message => {
        if(message.channel.parentID === user.lastMessage.channel.parentID && currentTime - message.createdTimestamp < 60000) {
          onlineUsersList.push({id: user.id, timestamp: message.createdTimestamp});
        }
        collector.stop("Got my message");
      })
    } else {
      if(message.channel.parentID === user.lastMessage.channel.parentID && currentTime - message.createdTimestamp < 60000) {
        onlineUsersList.push({id: user.id, timestamp: user.lastMessage.createdTimestamp});
      }
    }
  });
  let sortedOnlineUsersList = onlineUsersList.sort(compareDesc);
  let top5 = sortedOnlineUsersList.slice(0, 5);

  let onlineID = top5.map(function (user) {
    onlineUsername = onlineUsername + " <@" + user.id + ">";
    return user.id;
  });
  callback(onlineID,"No new messages, since I woke up", "MYNT drizzle initiated! \n" +
      "**" + amount/onlineID.length + " MYNT** rained down on " + onlineUsername + " :rocket:");
}

function sendMYNT(bot, message, tipper, recipient, amount, privacyFlag) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(10000));
    } else {
          mynt.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
              if (err) {
                message.reply(err.message).then(message => message.delete(10000));
              } else {
                if (privacyFlag) {
                  let userProfile = message.guild.members.find('id', recipient);
                  var iimessage =
                  ' You got privately tipped ' +
                  amount +
                  ' MYNT\n' +
                    txLink(txId) +
                    '\n' +
                    'DM me `.help` for bot instructions.';
            userProfile.user.send(iimessage);
            var imessage =
              ' You privately tipped ' +
              userProfile.user.username +
              ' ' +
              amount +
              ' MYNT\n' +
              txLink(txId) +
              '\n' +
              'DM me `.help` for bot instructions.';
            message.author.send(imessage);

            if (message.content.startsWith('.mynt private ')
            ) {
              message.delete(1000); //Supposed to delete message
            }
          } else {
            sendEmbedMessages(message, "", 3447003, [{
              name: "MYNT Tip",
              value: '<@' + tipper + '> tipped <@' +
              recipient +
              '> ' +
              amount +
              ' MYNT\n' +
              txLink(txId) +
              '\n' +
              'DM me `!help` for bot instructions.'
              }]);
              message.delete(1000);
          }
        }
      });
    }
  });
}

function getPrice(bot, msg){
  getDataFromAPI("https://trade.swiftex.co/api/v2/peatio/public/markets/tickers/", true, function(data){
    let firstResult = JSON.parse(data);
    let result = firstResult['myntbtc'];
    console.log(result);

    if (result !== "undefined") {
      if (result) {
        var perc = result.ticker.price_change_percent;
         sendEmbedMessages(msg, "", 3447003, [{
         name: "Swiftex - MYNT Price",
         value: "**" + result.ticker.last + "** - BTC/MYNT\n**" + perc + "** - change\n**" + result.ticker.volume + "** - 24 hour volume\n **" + result.ticker.buy + "** - Current Ask\n**" + result.ticker.sell + "** - Current Sell"
        }])
      } else {
        msg.reply("I can't find a price. Notify @DreadedZombie#6666 of a problem, please.")
      }
        }
  });
}

function getBlock(bot, msg){
 getDataFromAPI("http://mynt.evo.today/api/getblockcount", true, function(result){
   if (result !== "undefined") {
      if (result) {
        sendEmbedMessages(msg, "", 0x00AE86, [{
          name: "MYNT current block",
          value: "Block height: **" + result + "**"
        }])
      } else {
        msg.reply("No block height found. Notify @DreadedZombie#6666 of a problem, please.")
      }
   }
 })
}

function getSupply(bot, msg){
  getDataFromAPI("http://mynt.evo.today/ext/getmoneysupply", true, function(result){
    if (result !== "undefined") {
      if (result) {
        sendEmbedMessages(msg, "", 0xF55555, [{
          name: "MYNT current supply",
          value: "Supply: **" + result + "**"
        }])
      } else {
        msg.reply("No supply found. Notify @DreadedZombie#6666 of a problem, please.")
      }
   }
  })
}

function getDataFromAPI(url, sync, callback){
  let xmlHttp = new XMLHttpRequest();
  
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(xmlHttp.responseText);
    }
  };
  xmlHttp.open("GET", url, sync);
  xmlHttp.send(null);
}

function sendEmbedMessages(msg, description, color, fields) {
  let embed = new Discord.RichEmbed()
    .setTitle("Mynt")
    .setAuthor(msg.client.user.username, msg.client.user.avatarURL)
    .setColor(color)
    .setDescription(description)
    .setFooter("© Mynt", msg.client.user.avatarURL)
    .setTimestamp()
    .setURL("https://getmynt.io");
  fields.forEach(function(f){
    embed = embed.addField(f.name, f.value)
  });
  msg.channel.send(embed)
}

function getAddress(userId, cb) {
  mynt.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      mynt.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateorSpamChannel(msg) {
  if (msg.channel.type == 'dm' || isSpam(msg)) {
    return true;
  } else {
    return false;
  }
}
function isSpam(msg) {
  return spamchannels.includes(msg.channel.id);
};

function compareDesc(a,b) {
  if (a.timestamp < b.timestamp)
      return 1;
  if (a.timestamp > b.timestamp)
      return -1;
  return 0;
}

function getValidatedAmount(amount) {
  amount = amount.trim();
  if (amount.toLowerCase().endsWith('mynt')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function totals(bot, message) {
  if(message.author.id !== dev){
  }else{
    mynt.getbalance(dev, function(err, balance){
     message.channel.send(
      'Mynt total coins held: ' + balance
        );
    })
  }
}

function txLink(txId) {
  return 'https://insight.getmynt.io/tx/' + txId;
}
function addyLink(address) {
  return 'https://insight.getmynt.io/address/' + address;
}
