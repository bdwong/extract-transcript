const util = require('util');

function flatTopHeader() {
  return { level: 0, type: "top", version: "1.0" };
}

function flatBlockArrayHeader() {
  return { level: 1, type: "blockArray" };
}

function flatBlockHeader(block) {
  return { level: 2, type: "block", isNewLocale: block[1], locale: block[2] };
}

function flattenRecording(recording) {
  const flatRecording = [];
  const blockArray = recording[0];
  flatRecording.push(flatTopHeader());
  flatRecording.push(flatBlockArrayHeader());
  blockArray.forEach((block) => {
    flatRecording.push(flatBlockHeader(block));
    if (block.length > 0) {
      block[0].forEach((word) => {
        flatRecording.push(word);
      });
    }
  });
  return flatRecording;
}

function createFatHeader(header, collection) {
  switch (header.level) {
    case 0: // top level
      return collection; // Discard version number for now.
    case 1: // Array of speech blocks
      return collection;
    case 2: // Speech block
      if (collection.length > 0) {
        return [collection, header.isNewLocale, header.locale];
      } else {
        return [];
      }
    default:
      throw new Error(`Invalid header level: ${header.level} type: ${header.type}`);
  }
}

function fattenRecording(flat) {
  const headers = [];
  // Collections for a given header level n are stored in collections[n-1].
  let collections = [];

  function popHeaders(level) {
    while(headers.length > level) {
      // when a header is popped, create the fat header object, and
      // put the push the header into the parent collection.
      const h = headers.pop();
      const fatHeader = createFatHeader(h, collections[headers.length]);
      collections[headers.length-1].push(fatHeader);
    }
  }

  flat.forEach( (item) => {
    if (!Array.isArray(item)) {
      // header
      popHeaders(item.level);
      headers.push(item);
      collections[item.level] = [];
    } else {
      // word
      collections[headers.length-1].push(item);
    }
  });

  popHeaders(1); // Finish by creating the top level and returning it.
  return createFatHeader(headers.pop(), collections[0]);
}

// Trim leading and trailing non-word characters and spaces,
// and convert to lowercase.
function trim(word) {
  return word.replace(/(^[\W\s]+)|([\W\s]+$)/g, '').toLowerCase();
}

// Hyphenation.
// On trailing hyphens:
// '-' -> join next word
// '--' -> do nothing
// '---' -> join next word, keep hyphen
//
// On intra-word hyphens:
// '-' -> don't split
// '--' -> split word
// '---' -> split word, leave trailing double hyphen
//
// NOTE: ignore leading hyphens.
//
// If split and join are separate operations then the algorithm
// should split first, join second.

// Generator
function* splitHyphenGenerator(iterable) {
  let done, value;
  let iterator = iterable[Symbol.iterator]();
  for ({done, value} = iterator.next(); !done; {done, value} = iterator.next()) {
    if (!Array.isArray(value)) {
      // header
      yield value;
      continue;
    }
    // word
    const [undecorated, decorated, startStr, endStr, a, b, speaker] = value;
    // Perform hyphenation logic here.
    const startms = parseInt(startStr);
    const endms = parseInt(endStr);

    const toSplit = decorated??undecorated;
    // find: (^leading hyphens)?(nohyphen)+(hyphen)+(?!-|$)
    const matches =  Array.from(toSplit.matchAll(/(^-+)?([^-]+)(?:(-+)(?:($)|(?!-))|($))/mg));
    let matchStart = startms;
    let nextStart = matchStart;
    let prefix = '';
    let prefixStart = null;

    // console.error(`matches: ${util.inspect(Array.from(matches), {depth:null})}`);

    // Note: can't use forEach here because we use continue for control flow.
    for (let index=0; index < matches.length; index++) {
      let [match, lead, word, hyphen, tail1, tail2] = matches[index];
      // calculate word timings based on initial timing and match index.
      matchStart = nextStart;
      nextStart = Math.trunc((1+endms-startms)*(index+1)/matches.length + startms);

      // Don't deal with trailing hyphen on final match.
      let newWord;
      if (tail1==='' || tail2==='') {
        newWord = `${prefix}${match}`;
      } else {
        switch(hyphen) {
          case '-':
            // Don't split. Save prefix information.
            prefix = `${prefix}${lead??''}${word}-`;
            prefixStart = prefixStart??matchStart;
            continue;
          case '--':
            // Split.
            newWord = `${prefix}${lead??''}${word}`
            break;
          case '---':
            newWord = `${prefix}${lead??''}${word}--`;
            break;
          default:
            newWord = `${prefix}${match}`;
        }
      }
      if (prefixStart !== null) {
        matchStart = prefixStart;
      }
      const trimmed = trim(newWord);
      if (trimmed == newWord) {
        yield [trimmed, null, matchStart.toString(), (nextStart-1).toString(), a, b, speaker];
      } else {
        yield [trimmed, newWord, matchStart.toString(), (nextStart-1).toString(), a, b, speaker];
      }
      prefix = '';
      prefixStart = null;
    };
  }
  return;
}

function* joinHyphenGenerator(iterable) {
  const empty = 0;

  let done, value;
  let iterator = iterable[Symbol.iterator]();
  let prefixStartStr = null;
  let prefix = '';

  for ({done, value} = iterator.next(); !done; {done, value} = iterator.next()) {
    if (!Array.isArray(value)) {
      // header
      yield value;
      continue;
    }
    // word
    const [undecorated, decorated, startStr, endStr, a, b, speaker] = value;

    // Perform hyphenation logic here.
    const toJoin = decorated??undecorated;
    // find: ( ^(.*(nohyphen))(hyphen*)$ )
    const matches = toJoin.match(/^(.*[^-])(-*)$/m) ?? [];
    let [_match, word, hyphens] = matches;

    switch (hyphens) {
      case '-': // join to next word
        prefix = `${prefix}${word}`;
        prefixStartStr = prefixStartStr??startStr;
        continue;
      case '---': // join to next word with hyphen
        prefix = `${prefix}${word}-`;
        prefixStartStr = prefixStartStr??startStr;
        continue;
    }

    const newWord = `${prefix}${word}${hyphens}`;
    const trimmed = trim(newWord);
    if (trimmed == newWord) {
      yield [trimmed, null, prefixStartStr??startStr, endStr, a, b, speaker];
    } else {
      yield [trimmed, newWord, prefixStartStr??startStr, endStr, a, b, speaker];
    }
    prefix = '';
    prefixStartStr = null;
  }
  return;
}


function escapeRegEx(str) {
  return str.replaceAll(/[.?+*^$()[\]{}\\|]/g,"\\$&");
}

function escapeReplacementString(str) {
  return str.replaceAll(/\$/g,"$$$$");
}

function* replaceGenerator(iterable, ...pairs) {
  const mappings = pairs.map( ([target, replacement]) =>{
    return [
      new RegExp(String.raw`\b${escapeRegEx(target)}\b`, 'g'),
      escapeReplacementString(replacement)
    ];
  })

  let done, value;
  let iterator = iterable[Symbol.iterator]();

  for ({done, value} = iterator.next(); !done; {done, value} = iterator.next()) {
    if (!Array.isArray(value)) {
      // header
      yield value;
      continue;
    }
    // word
    const [undecorated, decorated, startStr, endStr, a, b, speaker] = value;

    const word = decorated??undecorated;
    let newWord = word;
    // find: match
    for (let i=0; i<mappings.length; i++) {
      const [target, replacement] = mappings[i];
      if (target.test(word)) {
        newWord = word.replaceAll(target, replacement);
        break;
      }
    }
    const trimmed = trim(newWord);
    if (trimmed == newWord) {
      yield [trimmed, null, startStr, endStr, a, b, speaker];
    } else {
      yield [trimmed, newWord, startStr, endStr, a, b, speaker];
    }
  }
  return;
}

// Returns a copy of the stream with words time shifted
// by offsetms.
function timeshiftStream(stream, offsetms) {
  const result = [];
  for (const el of stream) {
    if (!Array.isArray(el)) {
      result.push(el);
      continue;
    }
    // This is fine for primitive types, but objects will need
    // to be deep copied, otherwise the original object will be mutated.
    let word = [...el];
    word[2] = `${parseInt(word[2]) + offsetms}`;
    word[3] = `${parseInt(word[3]) + offsetms}`;
    result.push(word);
  }
  return result;
}


module.exports = {
  flattenRecording,
  fattenRecording,
  splitHyphenGenerator,
  joinHyphenGenerator,
  escapeRegEx,
  escapeReplacementString,
  replaceGenerator,
  timeshiftStream,
}