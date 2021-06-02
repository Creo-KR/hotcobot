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
    desc: "재부팅",
    exec: (m) => {
      m.reply("다시 돌아옵니다.").then(() => {
        process.exit();
      });
    },
  },

  사다리: {
    desc: "항목을 랜덤하게 나열 합니다. 📢 !사다리 사과 바나나 포도 딸기",
    exec: (m) => {
      let args = getArgs(m);
      console.log(args);
      if (args && args.length > 1) {
        let temp = [];
        for (let i = 0; i < args.length; i++) {
          let dice = Math.trunc(Math.random() * args.length);
          if (temp[dice]) i--;
          else temp[dice] = `${dice + 1} : ` + args[i];
        }

        reply(temp.join(", "), m);
      } else reply("띄어 쓰기로 항목을 추가 해주세요.", m);
    },
  },

  설명: {
    desc: "설명을 추가 합니다. 📢 !설명 크레오 👍",
    exec: (m) => {
      main.data;
      reply("등록되었습니다. 😀", m);
    },
  },

  크레오: {
    exec: (m) => {
      reply("😀", m);
    },
  },

  연방: {
    exec: (m) => {
      reply("핫카데미 샌드백입니다.", m);
    },
  },

  암살고기: {
    exec: (m) => {
      reply("핫카데미 연방 담당 일진입니다.", m);
    },
  },

  핫징: {
    exec: (m) => {
      reply("핫카데미 그 자체입니다.", m);
    },
  },

  제로백피시방: {
    exec: (m) => {
      reply(
        "\n주소: 경기도 평택시 고덕 여염9길 26 KR4차 지층 1층 고덕헤리움프라자\n영업시간: 24시간 영업\n연락처: 050-71302-8359",
        m
      );
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
const reply = (content, message) => {
  message.reply(content);
};

const getArgs = (message) => {
  let args = message.content.split(" ");
  return args.slice(1);
};

module.exports = cmd;
