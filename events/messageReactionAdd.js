const { User, MessageReaction } = require("discord.js");

module.exports = {
  name: "messageReactionAdd",
  /**
   * @param {MessageReaction} messageReaction
   * @param {User} user
   */
  exec: (reaction, user) => {
    //console.log(reaction);
  },
};
