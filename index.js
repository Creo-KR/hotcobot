const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
var data = require("./data.json");

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.exec(...args));
  } else {
    client.on(event.name, (...args) => event.exec(...args));
  }
}

client.once("ready", () => {
  module.exports.user = client.user;
  console.log(`${client.user.tag}으로 로그인 합니다.`);
  client.user.setActivity("!help 명령어 확인", { type: "WATCHING" });

  initialize();
});

// DISCORD BOT TOKEN
client.login(config.token);
const channels = [
  { id: 1, name: "임시", topic: "핫코봇 채널 1" },
  { id: 2, name: "임시2", topic: "핫코봇 채널 2" },
];

const initialize = () => {
  if (!data.guild) data.guild = [];

  // DEFAULT CHANNELS
  client.guilds.cache.each((guild) => {
    if (!data.guild[guild.id]) {
      createChannel(
        guild.channels,
        "핫코봇",
        {
          type: "category",
          position: 0,
        },
        (channel) => {
          data.guild[guild.id] = {
            name: guild.name,
            channels: {},
          };

          writeData(data);

          for (let chIndex = 0; chIndex < channels.length; chIndex++) {
            createChannel(
              guild.channels,
              channels[chIndex].name,
              { type: "text", topic: channels[chIndex].topic, parent: channel },
              (subChannel) => {
                data.guild[guild.id].channels[channels[chIndex].id] = {
                  id: subChannel.id,
                };
                writeData(data);
              }
            );
          }
        }
      );
    }
  });
};

/**
 *
 * @param {Discord.GuildChannelManager} channels
 * @param {string} name
 * @param {import("discord.js").GuildCreateChannelOptions} options
 * @param {Function} callback
 */
const createChannel = (channels, name, options, callback) => {
  channels.create(name, options).then((channel) => {
    callback(channel);
  });
};

module.exports.getData = () => {
  return data;
};

const writeData = (d) => {
  fs.writeFileSync("./data.json", JSON.stringify(d, undefined, "  "));
  data = d;
};
module.exports.writeData = writeData;
