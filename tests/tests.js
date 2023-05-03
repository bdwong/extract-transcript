const { mock, test, describe, beforeEach, it } = require('test');
const assert = require('node:assert/strict');
const path = require('node:path');

// TODO: load test config.
const { extract } = require('../lib/extractor');
const fs = require('fs');
const thisdir = path.join(__dirname, "testconfig.json")

describe('extractor', () => {
  it('reads a JSON file', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(Array.isArray(sample), true);
  });

  it('outputs the transcript of sample1', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(extract(sample), "\nHello world. This is a test.");
  });

  it('outputs the transcript of sample2', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(extract(sample), "\nThis is the first sentence. This is the second sentence.");
  });

  it.todo('outputs transcript with initial timestamp', () => {
    assert.equal(true, true);
  });

  it.todo('outputs transcript with periodic timestamp', () => {
    assert.equal(true, true);
  });
})
