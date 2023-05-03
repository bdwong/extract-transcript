const { mock, test, describe, beforeEach, it } = require('test');
const assert = require('node:assert/strict');

// TODO: load test config.
const { extract } = require('lib/extractor');
const fs = require('fs');

describe('extractor', () => {
  xit('reads a JSON file', () => {
    const sample = JSON.readFileSync('sample1.json');
    assert.equal({["Hello", "World"]}, sample);
  });

  xit('outputs the text of the file', () => {
    assert.equal(true, true);
  });

  xit('outputs transcript with initial timestamp', () => {
    assert.equal(true, true);
  });

  xit('outputs transcript with periodic timestamp', () => {
    assert.equal(true, true);
  });
})

