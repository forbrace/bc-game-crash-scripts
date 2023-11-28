var config = {
  gamesToWait: {
    value: 10,
    type: "number",
    label: "Games to Wait Before Starting",
  },
  baseBet: { value: 1, type: "number", label: "Base Bet Amount" },
};

function main() {
  var gamesWithout10 = getGamesWithout10();
  var numberOf10xCashedOut = 0;
  var userProfit = 0;
  var currentBet = config.baseBet.value;
  var isBettingNow = false;
  var loosingStreak = 0;
  var gamesToBeSafe = 100;
  var biggestBet = 0;

  var gamesTheBotCanHandle = calculateBotSafeness(
    config.baseBet.value,
    config.gamesToWait.value
  );
  log.info("FIRST LAUNCH | WELCOME!");
  log.info("Bot safety check:");
  log.info(
    `-> You can manage to loose ${gamesTheBotCanHandle} games without 10x before busting to zero`
  );
  log.info(`-> With the maximum bet: ${biggestBet}.`);
  log.info(
    `-> We do assume ${gamesToBeSafe} games is the maximum streak without 10x so...`
  );
  if (gamesTheBotCanHandle >= gamesToBeSafe) {
    log.info(`--> It looks safe with your parameters, let's go!`);
  } else {
    log.info(
      `--> Please stay around, it's not really safe with your parameters, chances to bust are quite high...`
    );
  }

  game.on("GAME_STARTING", function () {
    log.info("");
    log.info("NEW GAME");
    log.info(
      `Games since no 10x: ${gamesWithout10}. You can handle: ${gamesTheBotCanHandle} games without 10x.`
    );
    log.info(
      `Actual profit using the script: ${userProfit}. Got ${numberOf10xCashedOut} times 10x.`
    );
    if (gamesWithout10 > config.gamesToWait.value) {
      // Place bet
      game.bet(currentBet, 10);
      let wantedProfit = currentBet * 9 + userProfit;
      log.info(
        `Betting ${currentBet} right now, looking for ${wantedProfit} total profit.`
      );
      isBettingNow = true;
    } else {
      isBettingNow = false;
      let calculatedGamesToWait = config.gamesToWait.value - gamesWithout10;
      if (calculatedGamesToWait === 0) {
        log.info(`Betting ${config.baseBet.value} next game!`);
      } else {
        log.info(
          `Waiting for ${calculatedGamesToWait} more games with no 10x`
        );
      }
    }
  });

  game.on("GAME_ENDED", function () {
    let lastGameHistory = game.history[0];
    if (isBettingNow) {
      if (lastGameHistory.odds < 10) {
        log.info("Lost...");
        userProfit -= currentBet;
        loosingStreak++;
        if (loosingStreak === 9) {
          currentBet *= 2;
        }
        if (loosingStreak > 10 && (loosingStreak + 1) % 5 === 0) {
          currentBet *= 2;
        }
      } else {
        log.info("Won!");
        numberOf10xCashedOut++;
        loosingStreak = 0;
        userProfit = userProfit + currentBet * 9;
        currentBet = config.baseBet.value;
      }
    }
    if (lastGameHistory.odds < 10) {
      gamesWithout10++;
    } else {
      gamesWithout10 = 0;
    }
    log.info("END GAME");
  });

  function calculateBotSafeness(baseBet, gamesToWait) {
    let totalGames = gamesToWait;
    let balance = currency.amount;
    let gamesWithBets = 0;
    let nextBet = baseBet;
    let broken = false;

    while (!broken) {
      balance -= nextBet;
      totalGames++;
      gamesWithBets++;
      if (gamesWithBets % 9 === 0 && gamesWithBets < 10) {
        nextBet *= 2;
      } else if ((gamesWithBets + 1) % 5 === 0 && gamesWithBets > 10) {
        nextBet *= 2;
      }
      if (nextBet > balance) {
        biggestBet = nextBet;
        broken = true;
      }
    }
    return totalGames;
  }

  function getGamesWithout10() {
    let gamesArray = game.history;
    let result = 0;

    for (let i = 0; i < gamesArray.length; i++) {
      if (gamesArray[i].odds >= 10) {
        break;
      }
      result++;
    }
    log.info(JSON.stringify(game));
    return result;
  }
}
