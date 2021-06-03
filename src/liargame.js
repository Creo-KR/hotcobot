const client = require("../index");
const { Message } = require("discord.js");

const prefix = "🤥라이어 게임\n";

const suggestion = require("./liargame_suggestion.json");

module.exports = {
  new: (host) => {
    this.type = "LiarGame";
    this.main = null;

    this.host = host;
    this.guests = [];
    this.liarId = null;
    this.currentIdx = 0;

    this.canVote = false;
    this.voteCnt = 0;
    this.voteMap = { 1: 0 };
    this.voteUser = {};
    this.voter = -1;

    this.category = null;
    this.suggestion = null;

    this.button = {
      join: null,
      start: null,
      next: null,
      show: null,
      end: null,
    };

    /**
     * @param {Message} m
     */
    this.initialize = (m) => {
      this.main = m;

      let collector = m.createReactionCollector((r, u) => true);

      collector.on("collect", (r, u) => {
        if (u.id !== client.user.id) {
          //USER
          switch (r.emoji.name) {
            case "✋":
              if (host.id == u.id) r.users.remove(u);
              break;
            case "▶":
              if (host.id == u.id) this.start();
              r.users.remove(u);
              break;
            case "⏩":
              if (u.id == this.guests[this.currentIdx].id) this.next(u);
              r.users.remove(u);
              break;
            case "🕵️‍♂️":
              if (u.id == this.guests[this.voter].id) this.show();
              r.users.remove(u);
              break;
            case "🤥":
              this.end();
              break;
            default:
              r.remove();
          }
        } else {
          //BOT
          switch (r.emoji.name) {
            case "✋":
              this.button.join = r;
              break;
            case "▶":
              this.button.start = r;
              break;
            case "⏩":
              this.button.next = r;
              break;
            case "🕵️‍♂️":
              this.button.show = r;
              break;
            case "🤥":
              this.button.end = r;
              break;
          }
        }
      });

      m.react("✋");
      m.react("▶");
    };

    this.start = () => {
      this.guests.push(this.host);

      // 진행 인원 3명 이상
      if (this.button.join.count < 3) {
        this.main.edit(
          `<@!${this.host.id}>, 🤥라이어 게임 참가자를 모집합니다.\n참가자가 최소 3명 이상이 되어야 시작이 가능합니다.`
        );
        return;
      }

      this.button.join.users.fetch().then((map) => {
        let arr = map.filter((u) => u.id != client.user.id).map((u) => u);

        for (let i = 0; i < arr.length; i++) {
          this.guests.push(arr[i]);
          this.voteMap[i + 1 + ""] = 0;
        }

        this.setLiar();
        this.setSuggestion();
        this.sendSuggestion();
        this.setFirst();
      });

      this.button.join.remove();
      this.button.start.remove();

      this.main.edit(prefix + "지금 시작 합니다. 참가자에게 제시어 전달 중...");
    };

    this.setLiar = () => {
      this.guests.sort((a, b) => 0.5 - Math.random());

      let liarIdx = Math.trunc(Math.random() * this.guests.length);
      this.liarId = this.guests[liarIdx].id;
    };

    this.setSuggestion = () => {
      let cateIdx = Math.trunc(Math.random() * suggestion.length);
      this.category = suggestion[cateIdx].category;
      let suggIdx = Math.trunc(
        Math.random() * suggestion[cateIdx].suggestions.length
      );
      this.suggestion = suggestion[cateIdx].suggestions[suggIdx];
    };

    this.sendSuggestion = () => {
      for (let i = 0; i < this.guests.length; i++) {
        let guest = this.guests[i];
        let msg =
          prefix +
          "게임을 시작합니다.\n" +
          (guest.id == this.liarId
            ? "당신은 라이어🤥입니다.\n다른 사람의 힌트를 듣고 제시어를 유추하세요!"
            : `이번 제시어는 "${this.suggestion}" 입니다.\n라이어🤥에게 제시어를 들키지 않도록 힌트를 제공해주세요.`);
        guest.send(msg);
      }
    };

    this.setFirst = () => {
      this.main.edit(
        `${prefix}이번 주제는 "${this.category}" 입니다.\n <@!${
          this.guests[this.currentIdx].id
        }> 님부터 진행합니다.\n힌트를 말하고 다음 버튼을 눌러주세요.`
      );
      this.main.react("⏩");
    };

    this.next = (u) => {
      // 차례 확인
      if (u.id != this.guests[this.currentIdx].id) {
        return;
      }

      if (this.guests.length > this.currentIdx + 1) {
        this.currentIdx++;
        this.main.edit(
          `${prefix}이번 주제는 "${this.category}" 입니다.\n이번 차례는 <@!${
            this.guests[this.currentIdx].id
          }> 님입니다.\n힌트를 말하고 다음 버튼을 눌러주세요.`
        );
      } else {
        // 힌트 끝
        this.canVote = true;

        this.button.next.remove();

        let msg =
          "이제 라이어🤥로 의심되는 사람을 투표합니다.\n핫코봇 DM으로 번호를 보내주세요. 📢 !라이어 번호\n";
        for (let i = 0; i < this.guests.length; i++) {
          let guest = this.guests[i];
          msg += `${i + 1} : <@!${guest.id}>\n`;
          guest.send(prefix + "이 곳에서 투표를 참여해주세요. 📢 !라이어 번호");
        }

        msg += "투표 완료 : 0명";

        this.main.edit(prefix + msg);
      }
    };

    this.vote = (m, idx) => {
      console.log(m);

      let userId = m.author.id;
      // 투표 하는 시간 아닐 때
      if (!this.canVote) {
        m.reply(prefix + "지금은 투표할 수 없습니다.");
        return;
      }

      // 투표 참여 여부
      if (this.voteUser[userId]) {
        m.reply(prefix + "이미 투표에 참여하였습니다.");
        return;
      }

      // 유효한 숫자인지
      if (idx * 1 < 1 || idx * 1 > this.guests.length) {
        m.reply(prefix + "유효하지 않은 번호입니다.");
        return;
      }

      // 본인 인지
      if (this.guests[idx - 1].id == userId) {
        m.reply(prefix + "본인을 투표할 수 없습니다.");
        return;
      }

      // 게임 참여자인지
      let isGuest = false;
      for (let i = 0; i < this.guests.length; i++) {
        if (this.guests[i].id == userId) {
          isGuest = true;
          break;
        }
      }

      if (!isGuest) {
        m.reply(prefix + "게임 참여자만 투표할 수 있습니다.");
        return;
      }

      m.reply(prefix + "해당 번호로 투표했습니다.");

      this.voteMap[idx]++;
      this.voteUser[userId] = 1;
      this.voteCnt++;

      let msg = "";

      let isEnd = false;

      if (this.guests.length > this.voteCnt) {
        // 투표 중
        msg +=
          "이제 라이어🤥로 의심되는 사람을 투표합니다.\n핫코봇 DM으로 번호를 보내주세요. 📢 !라이어 번호\n";

        for (let i = 0; i < this.guests.length; i++) {
          let guest = this.guests[i];
          msg += `${i + 1} : <@!${guest.id}>\n`;
        }

        msg += `투표 완료 : ${this.voteCnt}명`;
      } else {
        // 투표 완료
        this.canVote = false;

        let max = -1;
        let isSame = false;

        for (let i = 0; i < this.guests.length; i++) {
          let score = this.voteMap[i + 1];
          this.voteMap[i + 1] = 0;

          if (max == score) isSame = true;
          else if (max < score) {
            isSame = false;
            max = score;
            this.voter = i;
          }
        }

        if (isSame) {
          // 동률일 때
          this.canVote = false;

          this.voteUser = {};
          this.voteCnt = 0;
          this.voter = -1;

          msg +=
            "투표가 완료되었으나 동률로 재투표를 합니다.\n핫코봇 DM으로 번호를 보내주세요. 📢 !라이어 번호\n";

          for (let i = 0; i < this.guests.length; i++) {
            let guest = this.guests[i];
            msg += `${i + 1} : <@!${guest.id}>\n`;
            guest.send(
              prefix + "이 곳에서 투표를 참여해주세요. 📢 !라이어 번호"
            );
          }

          msg += `투표 완료 : ${this.voteCnt}명`;
        } else {
          isEnd = true;
          msg += `투표가 완료되었습니다.\n최다 득표를 얻은 참여자는 <@!${
            this.guests[this.voter].id
          }>님입니다.\n알고 있는 제시어를 말하고 제시어를 확인해주세요!`;
        }
      }

      this.main.edit(prefix + msg);
      if (isEnd) {
        this.main.react("🕵️‍♂️");
      }
    };

    this.show = () => {
      this.button.show.remove();
      this.main.edit(
        `${prefix}이번 제시어는 ${this.suggestion} 였습니다!!\n그렇다면 라이어🤥는?`
      );
      this.main.react("🤥");
    };

    this.end = () => {
      this.button.end.remove();
      this.main.edit(
        `${prefix}라이어🤥는 <@!${this.liarId}>님입니다!!\n게임을 종료합니다.`
      );
    };

    return this;
  },
};
