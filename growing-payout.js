var config = {
  baseBet: { value: 1, type: "number", label: "Base Bet" },
  minimumPayout: { value: 2, type: "number", label: "Minimum Payout" },
  maximumPayout: { value: 100, type: "number", label: "Maximum Payout" },
};
function main() {
  let currentPayout = config.minimumPayout.value;
  let isBetting = false;
  let userProfit = 0;
  let isGoingUp = true;

  game.on("GAME_STARTING", function () {
    log.info("");
    log.info("NEW GAME");
    log.info(`Chasing payout: ${currentPayout}`);
    game.bet(config.baseBet.value, currentPayout);
    isBetting = true;
  });

  game.on("GAME_ENDED", function () {
    let gameInfos = game.history[0];
    if (isBetting) {
      if (!gameInfos.cashedAt) {
        //Lost
        if (isGoingUp) {
          currentPayout += 1;
          if (currentPayout >= config.maximumPayout.value && isGoingUp) {
            isGoingUp = false;
            log.info("Now going down.");
          }
        } else {
          currentPayout -= 1;
          if (currentPayout <= config.minimumPayout.value && !isGoingUp) {
            log.info("Now going up.");
            isGoingUp = true;
            currentPayout = config.minimumPayout.value;
          }
        }
        userProfit -= config.baseBet.value;
        log.info("Lost...");
      } else {
        //Won
        userProfit += config.baseBet.value;
        currentPayout = config.minimumPayout.value;
        log.info("Won! Returning to minimum payout.");
      }
      log.info(`Current profit: ${userProfit}.`);
    }
    log.info("END GAME");
  });
}
