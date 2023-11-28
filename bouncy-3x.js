var config = {
  baseBet: { value: 1, type: "number", label: "Base bet" },
  redStreak: { value: 5, type: "number", label: "Games under 3 to wait" },
  maxBet: { value: 10, type: "number", label: "Max bet before restarting" },
};

function main() {
  var currentBet = config.baseBet.value;
  var redStreakToWait = config.redStreak.value;
  var currentRedStreak = 0;
  var bettedGames = 0;
  var isBettingNow = false;
  var numberOf3xCashedOut = 0;
  var startingBalance = currency.amount;
  var currentStreakBets = [];

  log.info("FIRST LAUNCH | WELCOME!");

  game.on("GAME_STARTING", function () {
    log.info("********");
    log.info("NEW GAME");
    log.info(
      `Profit since starting the script: ${currency.amount - startingBalance} ${
        currency.currencyName
      }. Got ${numberOf3xCashedOut} times 3x.`
    );

    // If the red streak it attained, or we already started betting
    // go bet until we reach gamesToBetAfterRedStreak
    if (currentRedStreak >= redStreakToWait || bettedGames !== 0) {
      game.bet(currentBet, 3);
      bettedGames++;
      currentRedStreak = 0;
      currentStreakBets.push(currentBet);
      log.info(`Betting ${currentBet} this game.`);
      isBettingNow = true;
    } else {
      log.info(`Waiting for streak of ${redStreakToWait} games under 3x.`);
      log.info(`Current streak: ${currentRedStreak}.`);
      isBettingNow = false;
    }
  });

  game.on("GAME_ENDED", function () {
    let lastGameHistory = game.history[0];
    if (isBettingNow) {
      if (lastGameHistory.odds < 3) {
        // Lost
        log.info("Lost...");
        if (currentStreakBets.length > 1) {
          let tempBetAmount =
            currentStreakBets[currentStreakBets.length - 1] +
            currentStreakBets[currentStreakBets.length - 2];
          if (tempBetAmount > config.maxBet.value) {
            log.info("Resetting bets! Starting over...");
            currentStreakBets = [];
            currentBet = config.baseBet.value;
          } else {
            currentBet = tempBetAmount;
          }
        }
      } else {
        // Won
        log.info("Won!");
        currentStreakBets = [];
        currentBet = config.baseBet.value;
        numberOf3xCashedOut++;
        bettedGames = 0;
      }
    }
    // RED STREAK IS UNDER 3 FOR THIS SCRIPT
    if (lastGameHistory.odds < 3) {
      currentRedStreak++;
    } else {
      currentRedStreak = 0;
    }
    log.info("END GAME");
  });
}
