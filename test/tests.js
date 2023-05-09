const { mock, test, describe, beforeEach, it } = require('test');
const assert = require('node:assert/strict');
const path = require('node:path');

// TODO: load test config.
const {
  extract,
  extractWithTimestamps,
  extractWithBlockInterval,
  quantizeBlocks,
  softBreakBlocks,
  hardBreakBlocks,
  formatAsTranscript,
  formatAsSRT,
  WORD_TEXT,
} = require('../lib/extractor');
const fs = require('fs');
const thisdir = path.join(__dirname, "testconfig.json")

describe('test harness', () => {
  it('reads a JSON file', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(Array.isArray(sample), true);
  });
});

describe('extract', () => {

  it('outputs the transcript of sample1', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(extract(sample), "Hello world. This is a test.");
  });

  it('outputs the transcript of sample2', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(extract(sample), "This is the first sentence. This is the second sentence.");
  });
});

describe('extractWithTimestamps', () => {
  it('outputs transcript with initial timestamp', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(extractWithTimestamps(sample), "0:00\tHello world. This is a test.");
  });

  it('outputs one timestamp per block', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(extractWithTimestamps(sample), "0:00\tThis is the first sentence.\n0:05\tThis is the second sentence.");
  });
});

describe('extractWithBlockInterval', () => {
  it.todo('outputs transcript with block timestamp interval 10 seconds', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample3.json')));
    assert.equal(extractWithBlockInterval(sample, 10), "0:00\tStart of recording. Five second mark.\n0:10\tTen second mark. Fifteen second mark.\n0:20\tTwenty second mark.");
  });

  it.todo('outputs transcript with block timestamp interval 7 seconds', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample3.json')));
    assert.equal(extractWithBlockInterval(sample, 7), "0:00\tStart of recording. Five second mark.\n0:10\tTen second mark.\n0:15\tFifteen second mark. Twenty second mark.");
  });
});

describe('formatAsTranscript', () => {

  it('outputs the transcript of sample1', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(formatAsTranscript(sample[0]), "0:00\tHello world. This is a test.");
  });

  it('outputs the transcript of sample2', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(formatAsTranscript(sample[0]), "0:00\tThis is the first sentence.\n0:05\tThis is the second sentence.");
  });
});

describe('formatAsSRT', () => {

  it('outputs the srt of sample1', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(formatAsSRT(sample[0]), "1\n00:00:00,480 --> 00:00:02,700\nHello world. This is a test.\n");
  });

  it('outputs the srt of sample2', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(
      formatAsSRT(sample[0]),
      "1\n00:00:00,540 --> 00:00:02,340\nThis is the first sentence.\n\n" +
      "2\n00:00:05,340 --> 00:00:06,900\nThis is the second sentence.\n"
    );
  });
});

describe('quantizeBlocks', () => {
  it('combines blocks within the same interval' , () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    const blocks = quantizeBlocks(sample[0], 10000);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0][0].length, 10);
  });

  it ('does not combine blocks that are not in the same interval', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    const blocks = quantizeBlocks(sample[0], 5000);
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0][0].length, 5);
    assert.equal(blocks[0][0][3][WORD_TEXT], 'first');
    assert.equal(blocks[1][0].length, 5);
    assert.equal(blocks[1][0][3][WORD_TEXT], 'second');
  });
});

describe('softBreakBlocks', () => {
  it('breaks blocks on punctuation if character limit is exceeded', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    const blocks = softBreakBlocks(sample[0], 5);
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0][0].length, 2);
    assert.equal(blocks[1][0].length, 4);
  });
});

describe('hardBreakBlocks', () => {
  it('breaks block at current word if character limit is exceeded', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    const blocks = hardBreakBlocks(sample[0], 6);
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0][0].length, 1);
    assert.equal(blocks[1][0].length, 1);
    assert.equal(blocks[2][0].length, 2);
    assert.equal(blocks[3][0].length, 2);
  });
});
