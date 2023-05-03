const config = require('./lib/config');
const { program } = require('commander');
const { extractWithTimestamps, extractWithBlockInterval } = require('./lib/extractor');
const fs = require('node:fs');
const path = require('node:path');

program.option('-i, --interval <seconds>', 'print timestamp after specific interval (in seconds)')
program.parse();

const options = program.opts();

program.args.forEach(filepath => {
  const transcript = JSON.parse(fs.readFileSync(filepath));

  if (options.interval) {
    console.log(extractWithBlockInterval(transcript, options.interval));
  } else {
    console.log(extractWithTimestamps(transcript));
  }
});
