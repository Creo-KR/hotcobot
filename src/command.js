const { Message } = require("discord.js");
const client = require("../index");

const LiarGame = require("./liargame");

let game = null;

const cmd = {
  help: {
    desc: "도움말❔",
    exec: (m) => {
      deleteMessage(m);
      let content = "명령어 안내\n";
      let isFirst = true;
      for (cmdName in cmd) {
        if (isFirst) {
          isFirst = false;
        } else {
          content += "\n";
        }
        content += `!${cmdName}\t:\t${cmd[cmdName].desc || cmdName + " 설명"}`;
      }

      sendDM(content, m);
    },
  },

  reboot: {
    desc: "핫코봇 재부팅",
    exec: (m) => {
      m.reply("다시 돌아옵니다. 👀").then((m2) => {
        let data = client.getData();
        data.rebootMessage = { channelID: m2.channel.id, id: m2.id };
        client.writeData(data);

        process.exit();
      });
    },
  },

  사다리: {
    desc: "항목을 랜덤하게 나열 합니다. 📢 !사다리 사과 딸기 포도 배",
    exec: (m) => {
      let args = getArgs(m);
      if (args && args.length > 1) {
        args.sort((a, b) => 0.5 - Math.random());

        for (let i = 0; i < args.length; i++) {
          args[i] = `${i + 1} : ` + args[i];
        }

        reply("사다리 결과\n" + args.join("\n"), m);
      } else reply("띄어서 항목을 추가 해주세요.", m);
    },
  },

  라이어게임: {
    desc: "🤥라이어 게임을 시작합니다.",
    exec: (m) => {
      game = LiarGame.new(m.author);

      reply("🤥라이어 게임 참가자를 모집합니다.", m).then((m2) => {
        game.initialize(m2);
      });
    },
  },

  라이어: {
    desc: "라이어🤥를 투표합니다.",
    exec: (m) => {
      if (game && game.type == "LiarGame") {
        if (m.channel.type == "dm") {
          let args = getArgs(m);
          game.vote(m, args[0]);
        } else {
          m.delete();
        }
      }
    },
  },

  카던: {
    desc: "카오스 던전 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("카오스 던전 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  회랑: {
    desc: "태양의 회랑 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("태양의 회랑 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  도레: {
    desc: "도전 레이드 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("도전 레이드 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  쿤겔: {
    desc: "쿤겔라니움 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("쿤겔라니움 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  데칼: {
    desc: "데스칼루다 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("데스칼루다 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  벨가: {
    desc: "벨가누스 가실 분",
    /**
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("벨가누스 가실 분", m).then((m2) => {
        react("✋", m2);
      });
    },
  },

  메모: {
    desc: "메모를 추가하거나 제거 합니다. 📢 !메모 크레오 👍",
    exec: (m) => {
      let args = getArgs(m);

      if (args.length > 1) {
        let key = args[0];

        if (!key || cmd[key]) {
          reply("추가할 수 없습니다. 😅", m);
        } else {
          let value = args.slice(1).join(" ");

          let data = client.getData();
          if (!data.memo) data.memo = {};
          data.memo[key] = { value, author: m.author.id };
          client.writeData(data);

          reply("추가되었습니다. 😀", m);
        }
      } else if (args.length == 1) {
        let key = args[0];

        let data = client.getData();
        if (data.memo && data.memo[key]) {
          delete data.memo[key];
          client.writeData(data);
          reply("제거되었습니다. 😀", m);
        } else {
          reply("존재하지 않습니다. 😅", m);
        }
      }
    },
  },

  메모목록: {
    desc: "추가된 메모 목록을 확인합니다.",
    exec: (m) => {
      let temp = [];
      let data = client.getData();

      if (data.memo) {
        for (key in data.memo) {
          temp.push(key);
        }
      }

      temp.length > 0
        ? reply("메모 목록 : \n" + temp.join(", "), m)
        : reply("존재하지 않습니다. 😅", m);
    },
  },
};

/**
 * @param {Message} message
 */
const deleteMessage = (message) => {
  return message.delete().catch(() => {});
};

/**
 * @param {*} content
 * @param {Message} message
 */
const sendDM = (content, message) => {
  let sender = message.author;
  return sender.send(content).catch(console.error);
};

/**
 * @param {*} content
 * @param {Message} message
 */
const reply = (content, message) => {
  return message.reply(content);
};

const react = (reaction, message) => {
  return message.react(reaction);
};

const getArgs = (message) => {
  let args = message.content.split(" ");
  return args.slice(1);
};

module.exports = cmd;
