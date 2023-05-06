const config = require('./lib/config');
const { program, Option } = require('commander');
const {
  formatAsText,
  formatAsTranscript,
  formatAsSRT,
  quantizeBlocks,
 } = require('./lib/extractor');
const fs = require('node:fs');
const path = require('node:path');

program.option('-i, --interval <seconds>', 'print timestamp after specific interval (in seconds)');
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
  const transcript = JSON.parse(fs.readFileSync(filepath));

  let blocks = transcript[0];

  if (options.interval) {
    blocks = quantizeBlocks(blocks, options.interval*1000);
  }
  console.log(formatter(blocks));
});
