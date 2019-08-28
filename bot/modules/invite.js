'use strict';
exports.commands = ['invite'];
exports.invite = {
  usage: '<subcommand>',
  description: 'Discord invites',
  process: function(bot, message) {
     message.channel.send(
      'Share with your friends! \nhttps://discord.gg/mSJJRc7'
      );
   }
};
