const { Duration } = require('luxon');

const WORD_TEXT=0;
const WORD_DECORATED=1;
const WORD_START_MS=2;
const WORD_START_END=3;

function extract(recording) {
  let blocks = recording[0].map(b => {
    return b[0].map(word => ( (word[WORD_DECORATED] ?? word[WORD_TEXT])).trim() ).join(' ');
  });
  return blocks.join(' ');
}

function extractWithTimestamps(recording) {
  let blocks = recording[0].map(b => {
    let stamp = Duration.fromMillis(b[0][0][WORD_START_MS]);
    return [
      stamp.toFormat("m:ss"),
      b[0].map(word => ( (word[WORD_DECORATED] ?? word[WORD_TEXT])).trim() ).join(' ')
    ]
  });
  return blocks.map(b => ( `${b[0]}\t${b[1]}`) ).join('\n');
}

function extractWithBlockInterval(recording, interval) {
  let blocks = recording[0].map(b => {
    let stamp = b[0][0][WORD_START_MS]; //Duration.fromMillis(b[0][0][WORD_START_MS]).shiftTo('seconds').seconds;
    return [
      stamp, //.toFormat("m:ss"), // TODO: put seconds here.
      b[0].map(word => ( (word[WORD_DECORATED] ?? word[WORD_TEXT])).trim() ).join(' ')
    ]
  });

  const newBlocks = [];
  let lastInterval = Math.floor(blocks[0][0]/(1000*interval)); // Calculate lastInterval for the first element.

  // blocks reduce => another array with [time, text]
  newBlocks.push(blocks.reduce( (memo, block) => {
    // Memo is the blocks element that we are building up.
    let [time, text] = block;
    let thisInterval = Math.floor(time/(1000*interval));

    if (thisInterval == lastInterval) {
      // Same interval. Concatenate with the memo.
      memo[1] = memo[1].concat(' ', text);
    } else {
      // Different interval. Save the memo and replace it.
      newBlocks.push(memo);
      memo = block;
      lastInterval = thisInterval;
    }
    return memo;
  }));
  return newBlocks.map(b => {
    const formattedTime = Duration.fromMillis(b[0]).toFormat("m:ss");
    return `${formattedTime}\t${b[1]}`;
  } ).join('\n');
}

module.exports = { extract, extractWithTimestamps, extractWithBlockInterval };
