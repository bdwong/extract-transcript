const { Duration } = require('luxon');
const util = require('util');

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
  // Filter out empty blocks
  const filteredBlocks = blocks.filter(b => (b.length > 0));
  // Calculate lastInterval for the first element.
  let lastInterval = Math.floor(filteredBlocks[0][0][0][WORD_START_MS] / interval);

  // blocks reduce => new array of quantized blocks
  newBlocks.push(filteredBlocks.reduce( (newBlock, block, index) => {
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

function softBreakBlocks(blocks, softLimit) {
  const newBlocks = [];
  blocks.map(block => (
    softBreakBlock(block, softLimit)
  )).forEach(b => {
    newBlocks.push(...b);
  });
  return newBlocks;
}

// Given a block, break at end punctuation if the phrase has exceeded softLimit characters.
// Returns an array of blocks.
function softBreakBlock(block, softLimit) {
  let newBlocks = [];
  let newBlock;
  let blockCharCount = 0;
  const rePunctuation = /[.,;:!?]$/

  for (word of block[0]??[]) {
    const text = (word[WORD_DECORATED] ?? word[WORD_TEXT]).trim();
    const wordLength = text.length;
    if (blockCharCount == 0) {
      newBlock = [[word], block[1], block[2]];
      blockCharCount = wordLength;
      continue;
    }
    const hasPunctuation = rePunctuation.test(word[WORD_DECORATED]);
    blockCharCount += wordLength;
    if (blockCharCount > softLimit && hasPunctuation) {
      // break after this word.
      newBlock[0].push(word);
      newBlocks.push(newBlock);
      newBlock = [[], block[1], block[2]];
      blockCharCount = 0;
    } else {
      newBlock[0].push(word);
    }
  }

  if (blockCharCount != 0) {
    newBlocks.push(newBlock);
  }
  return newBlocks;
}

function hardBreakBlocks(blocks, hardLimit) {
  const newBlocks = [];
  blocks.map(block => (
    hardBreakBlock(block, hardLimit)
  )).forEach(b => {
    newBlocks.push(...b);
  });
  return newBlocks;
}

// Given a block, break at current word if the phrase has exceeded hardLimit characters.
// Returns an array of blocks.
function hardBreakBlock(block, hardLimit) {
  let newBlocks = [];
  let newBlock = [[], block[1], block[2]]
  let blockCharCount = 0;

  for (word of block[0]) {
    const text = (word[WORD_DECORATED] ?? word[WORD_TEXT]).trim();
    const wordLength = text.length;
    blockCharCount += wordLength;
    if (blockCharCount <= hardLimit || newBlock[0].length == 0) {
      // push word
      newBlock[0].push(word);
    } else {
      // blockCharCount > hardLimit
      // break at this word.
      newBlocks.push(newBlock);
      newBlock = [[word], block[1], block[2]];
      blockCharCount = wordLength;
    }
  }

  if (blockCharCount != 0) {
    newBlocks.push(newBlock);
  }
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

function formatAsWebVTT(blocks) {
  const header = [
    "WEBVTT",
    "",
    "STYLE",
    "::cue {",
    "  background-color: rgba(80,80,80,0.2)",
    "  color: #ffffff;",
    "}"
  ];
  const cues = [
    ...blocks.map((block, index) => {
      const words = block[0];
      // From the start of the first word to the end of the last word.
      const formattedStart = Duration.fromMillis(words[0][WORD_START_MS]).toFormat("hh:mm:ss.SSS");
      const formattedEnd = Duration.fromMillis(words[words.length-1][WORD_END_MS]).toFormat("hh:mm:ss.SSS");
      const text = formatWords(words);
      return `${formattedStart} --> ${formattedEnd}\n- ${text}`;
    })
  ];
  return header.join('\n').concat('\n\n', cues.join('\n\n'));
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
  softBreakBlocks,
  hardBreakBlocks,
  formatAsText,
  formatAsTranscript,
  formatAsSRT,
  formatAsWebVTT,
  WORD_TEXT,
 };
