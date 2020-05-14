/**
 * Minatures Crit Report Script
 * Author: AndruC
 * GitHub: https://github.com/AndruC/minis-script-roll20
 */

////////////////////////////////////////////////////////////////////////////////
// Code starts below
const CritReport = (() => {
  "use strict";

  const version = "0.1.0~dev";
  const NAME = "CritReport";

  function whois(playerid) {
    return (getObj("player", playerid) || { get: () => "API" }).get(
      "_displayname"
    );
  }

  function sendReport(crits, who) {
    const report = [
      ["twenties", crits.filter((x) => x.roll === 20).length],
      ["ones", crits.filter((x) => x.roll === 1).length],
      ["total", globalconfig.crits.length],
    ];
    sendChat(NAME, report.map((x) => `<div>${x[0]}: ${x[1]}</div>`).join(""));
  }

  log(`->->-> CritReport v${version} <-<-<-`);

  const handleCommandLine = (msg_orig) => {
    let args, cmds, who;

    if (msg_orig.type === "rollresult") {
      if (globalconfig.recording === false) return;
      const ctx = {
        rolls: JSON.parse(msg_orig.content).rolls,
        who: whois(msg_orig.playerid),
      };
      const isD20 = (roll) => roll.sides && roll.sides === 20;
      const isCrit = (roll) => roll.v === 1 || roll.v === 20;
      const schema = (roll) => ({ who: ctx.who, roll: roll.v });

      // track rolls

      const findRoll = (roll) => {
        if (roll.rolls) {
          return roll.rolls.map(findRoll);
        }
        if (isD20(roll)) {
          return roll.results.map(findRoll);
        }
        if (isCrit(roll)) {
          return schema(roll);
        }
      };

      sendChat(NAME, `/w "${ctx.who}" That's a crit!`);

      const crits = _.flatten(ctx.rolls.map(findRoll)).filter((x) => x);

      globalconfig.crits = crits.concat(globalconfig.crits);

      return;
    }

    try {
      if (msg_orig.type !== "api") return;
      let msg = _.clone(msg_orig);
      let { content } = msg;

      args = content.split(/\s+--/);

      switch (args.shift()) {
        case "!crit-report": {
          while (args.length) {
            who = whois(msg.playerid);
            cmds = args
              .shift()
              .match(/([^\s]+[|#]'[^']+'|[^\s]+[|#]"[^"]+"|[^\s]+)/g);

            switch (cmds.shift()) {
              case "help":
                sendChat(
                  NAME,
                  `/w "${who}" ` +
                    `<div style="margin-top: 1em;">` +
                    `<div><strong>Crit Report:</strong></div>` +
                    `<div>${NAME} keeps track of your highs and lows throughout your ` +
                    `session.</div>` +
                    `<code>!crit-report --start</code>` +
                    `<div>Start recording any rolled 1s and 20s that appear on d20 ` +
                    `rolls. This will clear any past data and start anew.</div>` +
                    `</div>` +
                    `<code>!crit-report --end</code>` +
                    `<div>Stop recording rolls.</div>` +
                    `</div>` +
                    `<code>!crit-report --report</code>` +
                    `<div>Display the latest crit report.</div>` +
                    `</div>`
                );
                break;
              case "start":
                globalconfig.recording = true;
                sendChat(
                  NAME,
                  `/w "${who}" ` +
                    `<div style="margin-top: 1em;"><strong>Recording started<strong></div>`
                );
                break;
              case "end":
                globalconfig.recording = false;
                sendChat(
                  NAME,
                  `/w "${who}" ` +
                    `<div style="margin-top: 1em;"><strong>Recording stopped<strong></div>`
                );
                sendReport(globalconfig.crits, who);
                break;
              case "report":
                sendReport(globalconfig.crits, who);
                break;
              default:
                sendChat(
                  NAME,
                  `/w "${who}" ` +
                    `<div>` +
                    `<div style="margin-top: 1em;"><strong>Unrecognized command:<strong></div>` +
                    `<div style="margin: 4px 12px 12px;"><code>${content}</code></div>` +
                    `<div>See <code>!minis --help</code></div>` +
                    `</div>`
                );
                break;
            }
          }
        }
      }
    } catch (e) {
      who = whois(msg_orig.playerid);
      sendChat(
        `${NAME} ${version}`,
        `/w "${who}" ` +
          `<div>` +
          `<div>There was an error while trying to run your command:</div>` +
          `<div style="margin: 4px 12px 12px;"><code>${msg_orig.content}</code></div>` +
          `<div style="margin: 4px 12px 12px;">If you think this is a bug, ` +
          `please report the issue. A stacktrace has been logged to the ` +
          `console.</div>` +
          `</div>`
      );
      e.stack
        .split(/\n/)
        .slice(0, 5)
        .forEach((m) => log(m));
    }
  };

  const registerEventHandlers = function () {
    on("chat:message", handleCommandLine);
  };

  on("ready", function () {
    globalconfig = {
      recording: false,
      crits: [],
    };
    registerEventHandlers();
  });
})();
