let config = require('config');
let pm2Name = config.get('moderation').pm2Name;
var roles = config.get('moderation').perms;
exports.commands = ['ban'];

exports.ban = {
  usage: '',
  description: 'Ban a user',
  process: async(client, message, args) => {

      if(!message.member.roles.some(r=>roles.includes(r.name)) )
          return message.reply("Sorry, you don't have permissions to use this!");
      
      let member = message.mentions.members.first() || message.guild.members.get(args[0]);
      if(!member)
          return message.reply("Please mention a valid member of this server");
  
      if(!member.kickable) 
          return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
  
      let reason = args.slice(1).join(' ');
      if(!reason) reason = "No reason provided";
          await member.kick(reason)
              .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
  
      const channel = member.guild.channels.find(ch => ch.name === 'bot-logs');
      if (!channel) return;
      channel.send(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);
  
  }
};
