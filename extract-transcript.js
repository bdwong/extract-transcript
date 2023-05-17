const config = require('./lib/config');
const { program, Option } = require('commander');
const {
  formatAsText,
  formatAsTranscript,
  formatAsSRT,
  quantizeBlocks,
  softBreakBlocks,
 } = require('./lib/extractor');
const fs = require('node:fs');
const path = require('node:path');
const {
  flattenRecording,
  fattenRecording,
  splitHyphenGenerator,
  joinHyphenGenerator,
} = require('./lib/flatRecording');

program.option('-i, --interval <seconds>', 'print timestamp after specific interval (in seconds)');
program.option('-s, --softbreak <numchars>', 'break block on first trailing punctuation after numchars characters');
program.option('-j, --join-hyphens', 'join words with trailing hyphens');
program.option('-b, --break-hyphens', 'break apart words with inline hyphens');
program.addOption(new Option('-f, --format <type>', 'output format')
  .choices(['txt', 'transcript', 'srt'])
  .default('transcript')
);
program.parse();

const options = program.opts();

let formatter;
switch(options.format) {
  case 'txt':
    formatter = formatAsText;
    break;
  case 'transcript':
    formatter = formatAsTranscript;
    break;
  case 'srt':
    formatter = formatAsSRT;
    break;
}

program.args.forEach(filepath => {
  let transcript = JSON.parse(fs.readFileSync(filepath));
  let recording = flattenRecording(transcript);
  if (options.breakHyphens) {
    recording = Array.from(splitHyphenGenerator(recording));
  }
  if (options.joinHyphens) {
     recording = Array.from(joinHyphenGenerator(recording));
  }
  transcript = fattenRecording(recording);

  let blocks = transcript[0];

  if (options.interval) {
    blocks = quantizeBlocks(blocks, options.interval*1000);
  }
  if (options.softbreak) {
    blocks = softBreakBlocks(blocks, options.softbreak);
  }
  console.log(formatter(blocks));
});
