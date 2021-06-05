const client = require("../index");
const { Message, MessageEmbed } = require("discord.js");

const suggestion = require("./liargame_suggestion.json");

module.exports = {
  /**
   * @param {Message} m
   */
  new: (m) => {
    let _this = this;

    _this.type = "LiarGame";
    _this.host = m.author;

    _this.main = null;
    _this.mainTemplate = new MessageEmbed({
      title: "🤥 라이어 게임",
      description:
        "참가자를 모집합니다. ✋ 버튼을 눌러 참가하세요.\n참가자가 모두 모이면 ▶ 버튼을 눌러 시작하세요.",
      color: 11062341,
      footer: { text: "•  •", iconURL: _this.host.avatarURL() },
      timestamp: new Date(),
    });
    _this.mainTemplateField = {
      vote: { name: "🗳️투표 번호", value: null },
      notice: { name: "❗안내", value: null },
    };

    _this.createDmTemplate = (desc) =>
      new MessageEmbed({
        title: "🤥 라이어 게임",
        description: desc,
        color: 11062341,
        author: {
          name: "↩ 돌아가기",
          url: _this.main.url,
        },
      });

    m.reply(_this.mainTemplate).then((m2) => {
      _this.main = m2;

      let collector = _this.main.createReactionCollector((r, u) => true);

      collector.on("collect", (r, u) => {
        if (u.id !== client.user.id) {
          //USER
          switch (r.emoji.name) {
            case "✋":
              if (_this.host.id == u.id) r.users.remove(u);
              break;
            case "▶":
              if (_this.host.id == u.id) _this.start();
              r.users.remove(u);
              break;
            case "⏩":
              if (u.id == _this.guests[_this.currentIdx].id) _this.next(u);
              r.users.remove(u);
              break;
            case "🕵️‍♂️":
              if (u.id == _this.guests[_this.voter].id) _this.show();
              r.users.remove(u);
              break;
            case "🤥":
              _this.end();
              break;
            case "🔄":
              _this.restart(u);
              break;
            default:
              r.remove();
          }
        } else {
          //BOT
          switch (r.emoji.name) {
            case "✋":
              _this.button.join = r;
              break;
            case "▶":
              _this.button.start = r;
              break;
            case "⏩":
              _this.button.next = r;
              break;
            case "🕵️‍♂️":
              _this.button.show = r;
              break;
            case "🤥":
              _this.button.end = r;
              break;
            case "🔄":
              this.button.restart = r;
              break;
          }
        }
      });

      _this.initialize();
    });

    _this.initialize = () => {
      _this.guests = [];
      _this.liarId = null;
      _this.currentIdx = 0;

      _this.canVote = false;
      _this.voteCnt = 0;
      _this.voteMap = { 1: 0 };
      _this.voteUser = {};
      _this.voter = -1;
      _this.liarVoteUser = [];

      _this.category = null;
      _this.suggestion = null;

      _this.button = {
        join: null,
        start: null,
        next: null,
        show: null,
        end: null,
        restart: null,
      };

      _this.main.react("✋");
      _this.main.react("▶");
    };

    _this.setField = (name, value) => {
      _this.mainTemplateField[name].value = value;
    };

    _this.applyTemplate = () => {
      let fields = [];
      for (f in _this.mainTemplateField) {
        if (_this.mainTemplateField[f].value) {
          fields.push({
            name: _this.mainTemplateField[f].name,
            value: _this.mainTemplateField[f].value,
          });
        }
      }

      _this.mainTemplate.fields = fields;

      _this.mainTemplate.setTimestamp(new Date());

      return _this.main.edit(_this.mainTemplate);
    };

    _this.start = () => {
      _this.guests.push(_this.host);

      // 진행 인원 3명 이상
      if (_this.button.join.count < 3) {
        _this.setField(
          "notice",
          "참가자가 최소 3명 이상이 되어야 시작이 가능합니다."
        );

        _this.applyTemplate();
        //return;
      }

      _this.button.join.users.fetch().then((map) => {
        let arr = map.filter((u) => u.id != client.user.id).map((u) => u);

        for (let i = 0; i < arr.length; i++) {
          _this.guests.push(arr[i]);
          _this.voteMap[i + 1] = 0;
        }

        _this.setLiar();
        _this.setSuggestion();
        _this.sendSuggestion();
        _this.setFirst();
      });

      _this.button.join.remove();
      _this.button.start.remove();

      _this.mainTemplate.setDescription(
        "지금 시작 합니다. 참가자에게 제시어 전달 중..."
      );

      _this.setField("notice");

      _this.applyTemplate();
    };

    _this.setLiar = () => {
      _this.guests.sort((a, b) => 0.5 - Math.random());

      let liarIdx = Math.trunc(Math.random() * _this.guests.length);
      _this.liarId = _this.guests[liarIdx].id;
    };

    _this.setSuggestion = () => {
      let cateIdx = Math.trunc(Math.random() * suggestion.length);
      _this.category = suggestion[cateIdx].category;
      let suggIdx = Math.trunc(
        Math.random() * suggestion[cateIdx].suggestions.length
      );
      _this.suggestion = suggestion[cateIdx].suggestions[suggIdx];
    };

    _this.sendSuggestion = () => {
      for (let i = 0; i < _this.guests.length; i++) {
        let guest = _this.guests[i];

        let dmTemplate = createDmTemplate(
          "게임을 시작합니다.\n" +
            (guest.id == _this.liarId
              ? "당신은 `라이어🤥`입니다.\n다른 사람의 힌트를 듣고 제시어를 유추하세요!"
              : `이번 제시어는 \`${_this.suggestion}\` 입니다.\n라이어🤥에게 제시어를 들키지 않도록 힌트를 제공해주세요.`)
        );

        guest.send(dmTemplate);
      }
    };

    _this.setFirst = () => {
      _this.mainTemplate.setDescription(
        `이번 주제는 \`${_this.category}\` 입니다.\n<@!${
          _this.guests[_this.currentIdx].id
        }> 님부터 진행합니다.`
      );

      _this.setField(
        "notice",
        "한 사람씩 제시어에 대한 힌트를 말하고 ⏩ 버튼을 눌러주세요."
      );

      _this.applyTemplate();

      _this.main.react("⏩");
    };

    _this.next = (u) => {
      // 차례 확인
      if (u.id != _this.guests[_this.currentIdx].id) {
        return;
      }

      if (_this.guests.length > _this.currentIdx + 1) {
        _this.currentIdx++;

        _this.mainTemplate.setDescription(
          `이번 주제는 \`${_this.category}\` 입니다.\n이번 차례는 <@!${
            _this.guests[_this.currentIdx].id
          }> 님입니다.`
        );

        _this.applyTemplate();
      } else {
        // 힌트 끝
        _this.canVote = true;

        _this.button.next.remove();

        _this.mainTemplate.setDescription(
          "이제 라이어🤥로 의심되는 사람을 투표합니다.\n투표 완료 : 0명"
        );

        let guestList = "";
        for (let i = 0; i < _this.guests.length; i++) {
          let guest = _this.guests[i];
          guestList += `${i + 1} : <@!${guest.id}>\n`;

          let dmTemplate = createDmTemplate(
            "이 곳에서 투표를 참여해주세요. 📢 !라이어 번호"
          );

          guest.send(dmTemplate);
        }

        _this.setField("vote", guestList);

        _this.setField(
          "notice",
          "핫코봇 DM으로 번호를 보내주세요. 📢 !라이어 번호"
        );

        _this.applyTemplate();
      }
    };

    _this.vote = (m, idx) => {
      let userId = m.author.id;
      // 투표 하는 시간 아닐 때
      if (!_this.canVote) {
        let dmTemplate = createDmTemplate("지금은 투표할 수 없습니다.");

        m.reply(dmTemplate);
        return;
      }

      // 투표 참여 여부
      if (_this.voteUser[userId]) {
        let dmTemplate = createDmTemplate("이미 투표에 참여하였습니다.");

        m.reply(dmTemplate);
        return;
      }

      // 유효한 숫자인지
      if (idx * 1 < 1 || idx * 1 > _this.guests.length) {
        let dmTemplate = createDmTemplate("유효하지 않은 번호입니다.");

        m.reply(dmTemplate);
        return;
      }

      // 본인 인지
      if (_this.guests[idx - 1].id == userId) {
        let dmTemplate = createDmTemplate("본인을 투표할 수 없습니다.");

        m.reply(dmTemplate);
        return;
      }

      // 게임 참여자인지
      let isGuest = false;
      for (let i = 0; i < _this.guests.length; i++) {
        if (_this.guests[i].id == userId) {
          isGuest = true;
          break;
        }
      }

      if (!isGuest) {
        let dmTemplate = createDmTemplate("게임 참여자만 투표할 수 있습니다.");

        m.reply(dmTemplate);
        return;
      }

      let dmTemplate = createDmTemplate(`${idx} 번으로 투표했습니다.`);

      m.reply(dmTemplate);

      _this.voteMap[idx * 1] += 1;
      _this.voteUser[userId] = 1;
      _this.voteCnt++;

      if (_this.guests[idx - 1].id == _this.liarId)
        _this.liarVoteUser.push(userId);

      let isEnd = false;

      if (_this.guests.length > _this.voteCnt) {
        // 투표 중
        _this.mainTemplate.setDescription(
          `이제 라이어🤥로 의심되는 사람을 투표합니다.\n투표 완료 : ${_this.voteCnt}명`
        );
      } else {
        // 투표 완료
        _this.canVote = false;

        let max = -1;
        let isSame = false;

        for (let i = 0; i < _this.guests.length; i++) {
          let score = _this.voteMap[i + 1];

          if (max == score) isSame = true;
          else if (max < score) {
            isSame = false;
            max = score;
            _this.voter = i;
          }

          _this.voteMap[i + 1] = 0;
        }

        if (isSame) {
          // 동률일 때
          _this.canVote = true;

          _this.voteUser = {};
          _this.voteCnt = 0;
          _this.voter = -1;
          _this.liarVoteUser = [];

          _this.mainTemplate.setDescription(
            `이제 라이어🤥로 의심되는 사람을 투표합니다.\n투표 완료 : ${_this.voteCnt}명`
          );

          _this.setField(
            "notice",
            `투표가 완료되었으나 동률(${max}표)로 재투표를 합니다.\n핫코봇 DM으로 번호를 보내주세요. 📢 !라이어 번호`
          );

          for (let i = 0; i < _this.guests.length; i++) {
            guest.send("이 곳에서 투표를 참여해주세요. 📢 !라이어 번호");
          }
        } else {
          // 투표 종료
          isEnd = true;

          _this.mainTemplate.setDescription(
            `투표가 완료되었습니다.\n최다 득표로 ${max}표를 얻은 참여자는 <@!${
              _this.guests[_this.voter].id
            }>님입니다.\n알고 있는 제시어를 말하고 제시어를 확인해주세요!`
          );

          _this.setField("vote");

          _this.setField(
            "notice",
            "최다 득표자는 🕵️‍♂️ 버튼을 눌러 제시어를 확인합니다."
          );
        }
      }

      _this.applyTemplate();

      if (isEnd) {
        _this.main.react("🕵️‍♂️");
      }
    };

    _this.show = () => {
      _this.button.show.remove();

      _this.mainTemplate.setDescription(
        `이번 제시어는 \`${_this.suggestion}\` 였습니다!!\n그렇다면 라이어🤥는?`
      );

      _this.setField("notice", "🤥 버튼을 눌러 라이어를 확인합니다.");

      _this.applyTemplate();

      _this.main.react("🤥");
    };

    _this.end = () => {
      _this.button.end.remove();

      let rightUser = "";
      if (_this.liarVoteUser.length > 0) {
        rightUser += "라이어🤥를 투표한 사람은 ";
        for (let i = 0; i < _this.liarVoteUser.length; i++) {
          rightUser += `<@!${_this.liarVoteUser[i]}> `;
        }
        rightUser += "입니다.";
      } else {
        rightUser =
          "라이어🤥를 투표한 사람이 없었습니다. 라이어🤥의 완벽한 승리입니다.";
      }

      _this.mainTemplate.setDescription(
        `라이어🤥는 <@!${_this.liarId}>님입니다!!\n\n${rightUser}\n게임을 종료합니다.`
      );

      _this.setField("notice", "재시작을 원하면 🔄버튼을 눌러주세요.");

      _this.applyTemplate();

      _this.main.react("🔄");
    };

    _this.restart = (u) => {
      _this.button.restart.remove();

      _this.mainTemplate.setDescription(
        "참가자를 모집합니다. ✋ 버튼을 눌러 참가하세요.\n참가자가 모두 모이면 ▶ 버튼을 눌러 시작하세요."
      );
      _this.setField("notice");
      _this.applyTemplate();

      _this.host = u;
      _this.mainTemplate.footer.iconURL = u.avatarURL();
      _this.initialize();
    };

    return _this;
  },
};
