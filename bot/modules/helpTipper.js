'use strict';
let config = require('config');
let myntFee = config.get('mynt').paytxfee;
let prefix = config.get('bot').prefix;
exports.commands = ['help'];
exports.help = {
  usage: '<subcommand>',
  description: 'This commands has been changed to currency specific commands!',
  process: function(bot, message) {
     message.author.send(
      '__**:bank: Coins :bank:**__\n' +
      '  **Mynt (MYNT) Tipper**\n    Transaction Fees: **' + myntFee + '**\n' +
      ' \n' +
      '__**Commands**__\n' +
      '  **' + prefix + 'mynt** : Displays This Message\n' +
      '  **' + prefix + 'mynt balance** : get your balance\n' +
      '  **' + prefix + 'mynt deposit** : get address for your deposits\n' +
      '  **' + prefix + 'mynt withdraw <ADDRESS> <AMOUNT>** : withdraw coins to specified address\n' +
      '  **' + prefix + 'mynt <@user> <amount>** :mention a user with @ and then the amount to tip them\n' +
      '  **' + prefix + 'mynt private <user> <amount>** : put private before Mentioning a user to tip them privately\n' +
      '  **' + prefix + 'price** : to get current price info for a coin\n' +
      ' \n' +
      '__**Examples**__\n' +
      '  **' + prefix + 'mynt @Dreadedzombie 10**\n' +
      '  **' + prefix + 'mynt withdraw MYNTaddressHERE 10**\n' +
      '  **' + prefix + 'mynt private @Dreadedzombie 10**\n' +
      '  **' + prefix + 'mynt balance**\n' +
      '  **' + prefix + 'mynt deposit**\n'
    );
  }
};
