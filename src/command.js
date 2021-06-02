const { Message } = require("discord.js");
const main = require("../index");

const cmd = {
  /**
   * @param {Message} message
   */
  help: {
    desc: "도움말❔",
    exec: (message) => {
      deleteMessage(message);
      let content = "명령어 안내\n";
      let isFirst = true;
      for (cmdName in cmd) {
        if (isFirst) {
          isFirst = false;
        } else {
          content += "\n";
        }
        content += `!${cmdName} : ${cmd[cmdName].desc || cmdName + " 설명"}`;
      }

      sendDM(content, message);
    },
  },

  reboot: {
    desc: "핫코봇 재부팅",
    exec: (m) => {
      m.reply("다시 돌아옵니다.👀").then(() => {
        process.exit();
      });
    },
  },

  사다리: {
    desc: "항목을 랜덤하게 나열 합니다. 📢 !사다리 사과 바나나 포도 딸기",
    exec: (m) => {
      let args = getArgs(m);
      if (args && args.length > 1) {
        let temp = [];
        for (let i = 0; i < args.length; i++) {
          let dice = Math.trunc(Math.random() * args.length);
          if (temp[dice]) i--;
          else temp[dice] = `${dice + 1} : ` + args[i] + "\n";
        }

        reply("사다리 결과\n" + temp.join(", "), m);
      } else reply("띄어 쓰기로 항목을 추가 해주세요.", m);
    },
  },

  회랑: {
    desc: "회랑 가실분",
    /**
     *
     * @param {Message} m
     */
    exec: (m) => {
      deleteMessage(m);
      reply("회랑 가실분", m, (m2) => {
        react("✋", m2);
      });
    },
  },

  메모: {
    desc: "메모를 추가 합니다. 📢 !메모 크레오 👍",
    exec: (m) => {
      let args = getArgs(m);

      if (args.length > 1) {
        let key = args[0];

        if (cmd[key]) {
          reply("등록할 수 없습니다. 😅", m);
        } else {
          let value = args.slice(1).join(" ");

          let data = main.getData();
          if (!data.memo) data.memo = {};
          data.memo[key] = value;
          main.writeData(data);

          reply("등록되었습니다. 😀", m);
        }
      } else if (args.length == 1) {
        let key = args[0];

        let data = main.getData();
        if (data.memo && data.memo[key]) {
          delete data.memo[key];
          main.writeData(data);
          reply("제거되었습니다. 😀", m);
        } else {
          reply("존재하지 않습니다. 😅", m);
        }
      }
    },
  },
};

/**
 * @param {Message} message
 */
const deleteMessage = (message) => {
  message.delete().catch(() => {});
};

/**
 * @param {any} content
 * @param {Message} message
 */
const sendDM = (content, message) => {
  let sender = message.author;
  sender.send(content).catch(console.error);
};

/**
 * @param {any} content
 * @param {Message} message
 */
const reply = (content, message, callback) => {
  let promise = message.reply(content);
  if (callback) promise.then((m) => callback(m));
};

const react = (reaction, message) => {
  message.react(reaction);
};

const getArgs = (message) => {
  let args = message.content.split(" ");
  return args.slice(1);
};

module.exports = cmd;
