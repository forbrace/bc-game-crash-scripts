var config = {
  baseBet: { value: 10, type: "number", label: "Base Bet" },
  chasingMultiplier: { value: 10, type: "number", label: "Multiplier" },
  gamesToWait: {
    value: 25,
    type: "number",
    label: "Games to wait before making a bet",
  },
  multiplyOrAdd: {
    value: "multiply",
    type: "radio",
    label: "Multiply or Add",
    options: [
      { value: "multiply", label: "Multiply by" },
      { value: "add", label: "Add to bet" },
    ],
  },
  multiplyOrAddValue: {
    value: 2,
    type: "number",
    label: "Value for Multiply or Add",
  },
  stopCondition: {
    value: "maxBet",
    type: "radio",
    label: "Stop condition",
    options: [
      { value: "maxBet", label: "Stop if bet is more than" },
      {
        value: "negativeProfit",
        label: "Stop if negative profit is more than",
      },
    ],
  },
  stopConditionValue: {
    value: 10000,
    type: "number",
    label: "Value for Stop condition",
  },
};

function main() {
  let baseBet = config.baseBet.value;
  let multiplier = config.chasingMultiplier.value;
  let gamesToWait = config.gamesToWait.value;

  let multiplyOrAdd = config.multiplyOrAdd.value;
  let multiplyValue, addValue;
  if (multiplyOrAdd === "multiply") {
    multiplyValue = config.multiplyOrAddValue.value;
  }
  if (multiplyOrAdd === "add") {
    addValue = config.multiplyOrAddValue.value;
  }

  let stopCondition = config.stopCondition.value;
  let maxBet, maxNegativeProfit;
  if (stopCondition === "maxBet") {
    maxBet = config.stopConditionValue.value;
  }
  if (stopCondition === "negativeProfit") {
    maxNegativeProfit = config.stopConditionValue.value;
  }

  let isBetting = false;
  let userProfit = 0;
  let gamesWithoutMultiplier = gamesWithoutX(multiplier);
  let bettingGames = 0;
  let numberOfCashOuts = 0;

  log.info("FIRST LAUNCH | WELCOME!");
  log.info(
    `It has been ${gamesWithoutMultiplier} games without ${multiplier}x.`
  );

  game.on("GAME_STARTING", function () {
    log.info("");
    log.info("NEW GAME");
    log.info(`Games without ${multiplier}x: ${gamesWithoutMultiplier}.`);
    log.info(
      `Actual profit using the script: ${userProfit}. Got ${numberOfCashOuts} times ${multiplier}x.`
    );

    if (gamesWithoutMultiplier >= gamesToWait) {
      let tempBaseBet = baseBet;
      game.bet(tempBaseBet, multiplier);
      isBetting = true;
      let currentBetInBits = tempBaseBet;
      let wantedProfit = currentBetInBits * (multiplier - 1) + userProfit;
      log.info(
        `Betting ${currentBetInBits} right now, looking for ${wantedProfit} total profit.`
      );
    } else {
      isBetting = false;
      let calculatedGamesToWait = gamesToWait - gamesWithoutMultiplier;
      if (calculatedGamesToWait === 1) {
        log.info(`Betting ${baseBet} next game!`);
      } else {
        log.info(
          `Waiting for ${calculatedGamesToWait} more games with no ${multiplier}x`
        );
      }
    }
  });

  game.on("GAME_ENDED", function () {
    let gameInfos = game.history[0];
    if (isBetting) {
      if (!gameInfos.cashedAt) {
        log.info("Lost...");
        userProfit -= baseBet;
        bettingGames++;
        if (
          bettingGames === multiplier - 1 ||
          (bettingGames > multiplier &&
            (bettingGames % multiplier === 0 ||
              bettingGames % multiplier === multiplier / 2))
        ) {
          if (multiplyValue !== undefined) {
            baseBet *= multiplyValue;
          }
          if (addValue !== undefined) {
            baseBet += addValue;
          }
        }

        if (maxBet !== undefined && baseBet > maxBet) {
          log.info(
            `Script stopped. Max bet reached: ${maxBet}. Profit is: ${userProfit}.`
          );
          game.stop();
        } else if (
          maxNegativeProfit !== undefined &&
          userProfit > maxNegativeProfit
        ) {
          log.info(
            `Script stopped. Max negative profit reached: ${userProfit}. Next bet would have been: ${baseBet}`
          );
          game.stop();
        }
      } else {
        log.info("Won! Returning to base bet");
        userProfit += baseBet * multiplier - baseBet;
        baseBet = config.baseBet.value;
        bettingGames = 0;
        numberOfCashOuts++;
      }
    }
    if (gameInfos.odds >= multiplier) {
      gamesWithoutMultiplier = 0;
    } else {
      gamesWithoutMultiplier++;
    }
    log.info(`Current profit: ${userProfit}.`);
    log.info("END GAME");
  });

  function gamesWithoutX(x) {
    let gamesArray = game.history;
    let result = 0;

    for (let i = 0; i < gamesArray.length; i++) {
      if (gamesArray[i].odds >= x) {
        break;
      }
      result++;
    }
    return result;
  }
}
