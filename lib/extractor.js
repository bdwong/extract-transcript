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


module.exports = { extract, extractWithTimestamps };
