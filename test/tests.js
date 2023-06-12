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
  formatAsWebVTT,
  WORD_TEXT,
} = require('../lib/extractor');
const {
  flattenRecording,
  fattenRecording,
  splitHyphenGenerator,
  joinHyphenGenerator,
  escapeRegEx,
  escapeReplacementString,
  replaceGenerator,
  timeshiftStream,
} = require('../lib/flatRecording');
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

describe('formatAsWebVTT', () => {

  it('outputs the WebVTT of sample1', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    assert.equal(formatAsWebVTT(sample[0]), [
      "WEBVTT",
      "",
      "STYLE",
      "::cue {",
      "  background-color: #22222222;",
      "  color: #ffffff;",
      "}",
      "",
      "00:00:00.480 --> 00:00:02.700",
      "Hello world. This is a test.",
    ].join('\n'));
  });

  it('outputs the WebVTT of sample2', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    assert.equal(formatAsWebVTT(sample[0]), [
      "WEBVTT",
      "",
      "STYLE",
      "::cue {",
      "  background-color: #22222222;",
      "  color: #ffffff;",
      "}",
      "",
      "00:00:00.540 --> 00:00:02.340",
      "This is the first sentence.",
      "",
      "00:00:05.340 --> 00:00:06.900",
      "This is the second sentence.",
    ].join('\n'));
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

  it ('ignores empty blocks', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample4.json')));
    const blocks = quantizeBlocks(sample[0], 10000);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0][0].length, 2);
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

describe('flattenRecording', () => {
  it('converts recording structure to flat array', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    const stream = flattenRecording(sample);
    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["hello","\nHello","480","1020",null,null,[0,0]],
      ["world","world.","1020","1380",null,null,[0,0]],
      ["this","This","1380","1920",null,null,[0,0]],
      ["is",null,"1920","2040",null,null,[0,0]],
      ["a",null,"2040","2520",null,null,[0,0]],
      ["test","test.","2520","2700",null,null,[0,0]]
    ]);
  })

  it('handles recordings with multiple blocks', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    const stream = flattenRecording(sample);
    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["this","\nThis","540","1320",null,null,[0,0]],
      ["is",null,"1320","1500",null,null,[0,0]],
      ["the",null,"1500","1620",null,null,[0,0]],
      ["first",null,"1620","1920",null,null,[0,0]],
      ["sentence","sentence.","1920","2340",null,null,[0,0]],
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["this","This","5340","5640",null,null,[1,1]],
      ["is",null,"5640","5700",null,null,[0,1]],
      ["the",null,"5700","6180",null,null,[0,1]],
      ["second",null,"6180","6300",null,null,[0,1]],
      ["sentence","sentence.","6300","6900",null,null,[0,1]],
    ]);
  })

  it('handles a recording with an empty block', () => {
    const sample = JSON.parse('[[[]]]');
    const stream = flattenRecording(sample);
    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: undefined, locale: undefined },
    ]);
  })
});

describe('fattenRecording', () => {
  it('converts flat array to recording structure', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    const flat = [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["hello","\nHello","480","1020",null,null,[0,0]],
      ["world","world.","1020","1380",null,null,[0,0]],
      ["this","This","1380","1920",null,null,[0,0]],
      ["is",null,"1920","2040",null,null,[0,0]],
      ["a",null,"2040","2520",null,null,[0,0]],
      ["test","test.","2520","2700",null,null,[0,0]]
    ];
    const result = fattenRecording(flat);
    assert.deepEqual(result, sample);
  })

  it('handles flat arrays with multiple blocks', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample2.json')));
    const flat = [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["this","\nThis","540","1320",null,null,[0,0]],
      ["is",null,"1320","1500",null,null,[0,0]],
      ["the",null,"1500","1620",null,null,[0,0]],
      ["first",null,"1620","1920",null,null,[0,0]],
      ["sentence","sentence.","1920","2340",null,null,[0,0]],
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["this","This","5340","5640",null,null,[1,1]],
      ["is",null,"5640","5700",null,null,[0,1]],
      ["the",null,"5700","6180",null,null,[0,1]],
      ["second",null,"6180","6300",null,null,[0,1]],
      ["sentence","sentence.","6300","6900",null,null,[0,1]],
    ];
    const result = fattenRecording(flat);
    assert.deepEqual(result, sample);
  })

  it('handles a flat array with an empty block', () => {
    const sample = JSON.parse('[[[]]]');
    const flat = [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: undefined, locale: undefined },
    ]
    const result = fattenRecording(flat);
    assert.deepEqual(result, sample);
  })

});

describe('splitHyphenGenerator', () => {
  it('splits internal hyphens', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample5.json')));
    const stream = flattenRecording(sample);
    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["the-one--word---wonder","The-one--word---wonder--","420","1890",null,null,[0,0]]
    ]);
    const splitIterator = splitHyphenGenerator(stream);
    const output = Array.from(splitIterator);
    assert.deepEqual(output, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["the-one","The-one","420","1154",null,null,[0,0]],
      // Note: "one-word" matches twice, so the word duration includes both matches.
      ["word","word--","1155","1522",null,null,[0,0]],
      ["wonder","wonder--","1523","1890",null,null,[0,0]]
    ]);
  })
});

describe('joinHyphenGenerator', () => {
  it('joins words on trailing hyphens', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample6.json')));
    const stream = flattenRecording(sample);
    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["force","Force-","100","199",null,null,[0,0]],
      ["hyphen","-hyphen---","200","299",null,null,[0,0]],
      ["ated",null,"300","399",null,null,[0,0]],
      ["a","\nA-","400","499",null,null,[0,0]],
      ["2","2-","500","599",null,null,[0,0]],
      ["3","3--","600","699",null,null,[0,0]],
      ["ea","ea-","700","799",null,null,[0,0]],
      ["sy","sy?","800","899",null,null,[0,0]]
    ]);
    const joinIterator = joinHyphenGenerator(stream);
    const output = Array.from(joinIterator);
    assert.deepEqual(output, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      // Note: "one-word" matches twice, so the word duration includes both matches.
      ["force-hyphen-ated","Force-hyphen-ated","100","399",null,null,[0,0]],
      // Note: leading newline is trimmed from output.
      ["a23","A23--","400","699",null,null,[0,0]],
      ["easy","easy?","700","899",null,null,[0,0]]
    ]);
  })
});

describe('escapeRegEx', () => {
  it('escapes all regular expression special characters', () => {
    assert.equal(
      escapeRegEx(String.raw`a+*?.()[]{}\^$|`),
      String.raw`a\+\*\?\.\(\)\[\]\{\}\\\^\$\|`
    );
  });
});

describe('escapeReplacementString', () => {
  it('escapes string replace special characters', () => {
    assert.equal(
      escapeReplacementString('a$b$'),
      'a$$b$$'
    );
  });
});

describe('replaceGenerator', () => {
  it('substitutes searched text with replacement text', () => {
    const stream = [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["I",null,"100","199",null,null,[0,0]],
      ["write","write,","200","299",null,null,[0,0]],
      ["i",null,"400","499",null,null,[0,0]],
      ["note","note:","500","599",null,null,[0,0]],
      ["*not*",null,"700","799",null,null,[0,0]],
      ["i","i.","800","899",null,null,[0,0]]
    ];
    const replaceIterator = replaceGenerator(
      stream,
      ['i', 'I'],
      ['not', 'yet']
    );
    const output = Array.from(replaceIterator);
    assert.deepEqual(output, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["i","I","100","199",null,null,[0,0]],
      ["write","write,","200","299",null,null,[0,0]],
      ["i","I","400","499",null,null,[0,0]],
      ["note","note:","500","599",null,null,[0,0]],
      ["yet","*yet*","700","799",null,null,[0,0]],
      ["i","I.","800","899",null,null,[0,0]]
    ]);
  })
})

describe('timeshiftStream', () => {
  it('shifts timing of words by positive amount ', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    let stream = flattenRecording(sample);
    stream = timeshiftStream(stream, 1200);

    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["hello","\nHello","1680","2220",null,null,[0,0]],
      ["world","world.","2220","2580",null,null,[0,0]],
      ["this","This","2580","3120",null,null,[0,0]],
      ["is",null,"3120","3240",null,null,[0,0]],
      ["a",null,"3240","3720",null,null,[0,0]],
      ["test","test.","3720","3900",null,null,[0,0]]
    ]);
  });

  it('shifts timing of words by negative amount ', () => {
    const sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample1.json')));
    let stream = flattenRecording(sample);
    stream = timeshiftStream(stream, -500);

    assert.deepEqual(stream, [
      { level: 0, type: "top", version: "1.0" },
      { level: 1, type: "blockArray" },
      { level: 2, type: "block", isNewLocale: 0, locale: "en-US" },
      ["hello","\nHello","-20","520",null,null,[0,0]],
      ["world","world.","520","880",null,null,[0,0]],
      ["this","This","880","1420",null,null,[0,0]],
      ["is",null,"1420","1540",null,null,[0,0]],
      ["a",null,"1540","2020",null,null,[0,0]],
      ["test","test.","2020","2200",null,null,[0,0]]
    ]);
  });

});
