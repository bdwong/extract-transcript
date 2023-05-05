const { mock, test, describe, beforeEach, it } = require('test');
const assert = require('node:assert/strict');
const path = require('node:path');

// TODO: load test config.
const { extract, extractWithTimestamps, extractWithBlockInterval } = require('../lib/extractor');
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
