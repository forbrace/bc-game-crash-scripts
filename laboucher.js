var config = {
  initialSequence: {
    value: "1,2,3,4,5",
    type: "text",
    label: "Initial Sequence",
  },
  initialBalance: { value: 1000, type: "number", label: "Initial Balance" },
};

function main() {
  let sequence = config.initialSequence.value.split(",").map(Number);
  let balance = config.initialBalance.value;

  function calculateNextBet() {
    if (sequence.length === 0) {
      return 0;
    }
    if (sequence.length === 1) {
      return sequence[0];
    }
    return sequence[0] + sequence[sequence.length - 1];
  }

  game.on("GAME_STARTING", function () {
    const nextBet = calculateNextBet();
    if (!nextBet || !sequence.length) {
      log.info(`That's it, folks. Nothing lasts forever. Adjust your next algorithm.`);
      game.stop();
    }
    if (balance >= nextBet) {
      game.bet(nextBet, 2);
    } else {
      game.stop();
    }
  });

  game.on("GAME_ENDED", function () {
    const gameInfo = game.history[0];
    if (gameInfo.cashedAt) {
      sequence.shift();
      sequence.pop();
      balance += calculateNextBet();
    } else {
      sequence.push(calculateNextBet());
      balance -= calculateNextBet();
    }
  });
}
