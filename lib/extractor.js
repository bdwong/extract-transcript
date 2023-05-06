const { Duration } = require('luxon');

const WORD_TEXT=0;
const WORD_DECORATED=1;
const WORD_START_MS=2;
const WORD_END_MS=3;

function extract(recording) {
  let blocks = recording[0];
  return formatAsText(blocks);
}

function extractWithTimestamps(recording) {
  let blocks = recording[0];
  return formatAsTranscript(blocks);
}

function extractWithBlockInterval(recording, interval) {
  let blocks = recording[0];
  return formatAsTranscript(quantizeBlocks(blocks, interval*1000));
}

// Given an array of blocks and an interval (in ms),
// return a new array of combined blocks
// whose start times (in ms) are within the same interval.
// Example, if blocks have a start time of [0, 3000, 6000, 9000] and
// the interval is 5000, then the first 2 blocks and the last 2 blocks
// are combined and the two combined blocks with timings [0, 6000] are returned.
//
function quantizeBlocks(blocks, interval) {
  const newBlocks = [];
  // Calculate lastInterval for the first element.
  let lastInterval = Math.floor(blocks[0][0][0][WORD_START_MS] / interval);

  // blocks reduce => new array of quantized blocks
  newBlocks.push(blocks.reduce( (newBlock, block) => {
    // newBlock is the block element that we are building up.
    let startTime = block[0][0][WORD_START_MS];
    let thisInterval = Math.floor(startTime/interval);

    if (thisInterval == lastInterval) {
      // Same interval. Add words to newBlock.
      newBlock[0].push(...block[0]);
    } else {
      // Different interval. Save the memo and replace it.
      newBlocks.push(newBlock);
      newBlock = block;
      lastInterval = thisInterval;
    }
    return newBlock;
  }));

  return newBlocks;
}

// Given an array of speech blocks,
// return a string representation of the speech formatted as simple text.
function formatAsText(blocks) {
  return blocks.map(
    b => (formatWords(b[0]))
  ).join(' ');
}

// Given an array of speech blocks,
// return a string representation of the speech formatted as a transcript.
function formatAsTranscript(blocks) {
  return blocks.map((block) => {
    const words = block[0];
    const formattedTime = Duration.fromMillis(words[0][WORD_START_MS]).toFormat("m:ss");
    const text = formatWords(words);
    return `${formattedTime}\t${text}`;
  }).join('\n');
}

// Given an array of speech blocks,
// return a string representation of the speech in SRT format.
function formatAsSRT(blocks) {
  return blocks.map((block, index) => {
    const words = block[0];
    // From the start of the first word to the end of the last word.
    const formattedStart = Duration.fromMillis(words[0][WORD_START_MS]).toFormat("hh:mm:ss,SSS");
    const formattedEnd = Duration.fromMillis(words[words.length-1][WORD_END_MS]).toFormat("hh:mm:ss,SSS");
    const text = formatWords(words);
    return `${index+1}\n${formattedStart} --> ${formattedEnd}\n${text}\n`;
  }).join('\n');
}

// Given a word collection, return a string representaton of words.
function formatWords(words) {
  return words.map(word => ( (word[WORD_DECORATED] ?? word[WORD_TEXT])).trim() ).join(' ')
}

module.exports = {
  extract,
  extractWithTimestamps,
  extractWithBlockInterval,
  quantizeBlocks,
  formatAsTranscript,
  formatAsSRT,
  WORD_TEXT,
 };
