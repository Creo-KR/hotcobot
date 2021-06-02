const client = require("../index");
const config = require("../config.json");
const command = require("../src/command");
const { Message } = require("discord.js");
const main = require("../index");

module.exports = {
  name: "message",
  /**
   * @param {Message} message
   */
  exec: (message) => {
    // Command
    if (
      message.author.id != client.user.id &&
      message.content.startsWith(config.prefix) &&
      message.content.length > 1
    ) {
      let args = message.content.split(" ");
      let cmd = args[0].replace(/\!/, "");
      if (command[cmd]) command[cmd].exec(message);
      else {
        let data = main.getData();
        if (data.memo[cmd]) {
          message.reply(data.memo[cmd]);
        }
      }
    }
  },
};
