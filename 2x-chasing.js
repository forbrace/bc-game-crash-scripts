var config = {
  baseBet: { value: 1, type: "number", label: "Base bet" },
  redStreakToWait: {
    value: 10,
    type: "text",
    label: "Red games to wait before making a bet",
  },
  streakMinutes: {
    value: 15,
    type: "number",
    label: "Minutes to bet after a streak",
  },
  streakGames: {
    value: 50,
    type: "number",
    label: "Games to bet after a streak",
  },
  strategy: {
    value: "minutes",
    type: "radio",
    label: "Minutes or games",
    options: [
      {
        value: "minutes",
        label: "Minutes to bet after a streak",
      },
      {
        value: "games",
        label: "Games to bet after a streak",
      },
    ],
  },
};

function main() {
  let biggestBet = 0;
  let currentRedStreak = InitialRedStreak();
  const gamesTheBotCanHandle = CalculateBotSafeness(
    config.baseBet.value,
    config.redStreakToWait.value
  );
  let userProfit = 0;
  let numberOf2xCashedOut = 0;
  let currentBet = config.baseBet.value;
  let isBettingNow = false;
  let gamesToBeSafe = 25;
  let minutesLeft = 0;
  let gamesLeft = 0;
  let startingStreakDate = null;
  let redStreakOverLimit = null;
  let wonLastGame = true;
  const STREAK_MINUTES = 15;
  const STREAK_GAMES = 50;

  log.info("FIRST LAUNCH | WELCOME!");
  log.info("Bot safety check :");
  log.info(
    "-> You can manage to loose a " + gamesTheBotCanHandle + " red streak."
  );
  log.info("-> The maximum bet would be: " + biggestBet);
  log.info("-> We do assume 25 games is the maximum streak without 2x so...");
  if (gamesTheBotCanHandle >= gamesToBeSafe) {
    log.info("--> It looks safe with your parameters, let's go!");
  } else {
    log.info(
      "--> Please stay around, it's not really safe with your parameters, chances to bust are quite high..."
    );
  }
  log.info("There is a streak of " + currentRedStreak + " red games now.");

  game.on("GAME_STARTING", function () {
    log.info("");
    log.info("NEW GAME");
    log.info(
      "Games since no 2x: " +
        currentRedStreak +
        ". You can handle: " +
        gamesTheBotCanHandle +
        " games without 2x."
    );
    log.info(
      "Actual profit using the script: " +
        userProfit +
        ". Got " +
        numberOf2xCashedOut +
        " times 2x."
    );

    if (
      redStreakOverLimit ||
      minutesLeft > 0 ||
      gamesLeft > 0 ||
      !wonLastGame
    ) {
      //do place bet
      let nowDate = Date.now();
      if (minutesLeft === 0 && gamesLeft === 0 && wonLastGame) {
        registerDateOrGames(nowDate);
      }
      updateMinutesLeftOrGames(nowDate);
      if (minutesLeft > 0 || gamesLeft > 0 || !wonLastGame) {
        if (minutesLeft > 0 && gamesLeft === 0) {
          log.info(
            "Will continue to bet for the next " + minutesLeft + " minutes."
          );
        } else {
          log.info(
            "Will continue to bet for the next " + gamesLeft + " games."
          );
        }
        game.bet(currentBet, 2);
        let wantedProfit = currentBet + userProfit;
        log.info(
          "Betting " +
            currentBet +
            " right now, looking for " +
            wantedProfit +
            " total profit."
        );
        isBettingNow = true;
      } else {
        isBettingNow = false;
      }
    } else {
      isBettingNow = false;
      let calculatedGamesToWait =
        config.redStreakToWait.value - currentRedStreak;
      if (calculatedGamesToWait < 1) {
        log.info("Will begin to bet shortly");
      } else {
        log.info(
          "Waiting for " + calculatedGamesToWait + " more games with no 2x"
        );
      }
    }
  });

  game.on("GAME_ENDED", function () {
    let lastGame = game.history[0];
    wonLastGame = true;
    if (isBettingNow) {
      if (!lastGame.cashedAt) {
        log.info("Lost...");
        wonLastGame = false;
        userProfit -= currentBet;
        currentBet *= 2;
      } else {
        log.info("Won!");
        numberOf2xCashedOut++;
        userProfit = userProfit + currentBet;
        currentBet = config.baseBet.value;
      }
    }
    if (lastGame.odds < 2) {
      currentRedStreak++;
    } else {
      redStreakOverLimit = currentRedStreak >= config.redStreakToWait.value;
      currentRedStreak = 0;
    }
    log.info("END GAME");
  });

  function CalculateBotSafeness(baseBetForBot, gamesToWaitForBot) {
    let totalGames = gamesToWaitForBot;
    let balance = currency.amount;
    let nextBet = baseBetForBot;
    let broken = false;
    let totalBet = 0;

    while (!broken) {
      balance -= nextBet;
      totalGames++;
      totalBet += nextBet;
      biggestBet = nextBet;
      nextBet *= 2;
      if (nextBet > balance) {
        broken = true;
      }
    }
    return totalGames;
  }

  function InitialRedStreak() {
    let gamesArray = game.history;
    let generatedRedStreak = 0;

    for (let i = 0; i < gamesArray.length; i++) {
      if (gamesArray[i].odds >= 2) {
        break;
      }
      generatedRedStreak++;
    }
    return generatedRedStreak;
  }

  function updateMinutesLeftOrGames(currentDate) {
    if (config.strategy.value === "minutes") {
      if (startingStreakDate && minutesLeft > 0) {
        minutesLeft =
          config.streakMinutes.value -
          Math.floor((currentDate - startingStreakDate) / 1000 / 60);
      }
      if (minutesLeft === 0) {
        startingStreakDate = null;
      }
    } else if (config.strategy.value === "games") {
      if (gamesLeft > 0) {
        gamesLeft--;
      }
    }
  }

  function registerDateOrGames(currentDate) {
    if (config.strategy.value === "minutes") {
      log.info("Registered minutes");
      if (!startingStreakDate) {
        startingStreakDate = currentDate;
        minutesLeft = config.streakMinutes.value;
      }
    } else if (config.strategy.value === "games") {
      log.info("Registered games");
      gamesLeft = config.streakGames.value;
      gamesLeft++;
    }
  }
}
