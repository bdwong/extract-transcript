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
    block[0].forEach((word) => {
      flatRecording.push(word);
    });
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
      return [collection, header.isNewLocale, header.locale];
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
// '-' -> split word, removing the hyphen
// '--' -> don't split, reduce to single hyphen
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
    // find: (^leading hyphens)?(nohyphen)+(hyphen)+(?!-|$)
    const startms = parseInt(startStr);
    const endms = parseInt(endStr);

    const toSplit = decorated??undecorated;
    const matches =  Array.from(toSplit.matchAll(/(^-+)?([^-]+)(?:(?:(-+)(?!-))|($))/g));
    let matchStart = startms;
    let nextStart = matchStart;
    let prefix = '';
    let prefixStart = null;

    // Note: can't use forEach here because we use continue for control flow.
    for (let index=0; index < matches.length; index++) {
      let [match, lead, word, hyphen, _ignore, tail] = matches[index];
      // calculate word timings based on initial timing and match index.
      matchStart = nextStart;
      nextStart = Math.trunc((1+endms-startms)*(index+1)/matches.length + startms);

      // Don't deal with trailing hyphen on final match.
      let newWord;
      if (tail==='') {
        newWord = `${prefix}${match}`;
      } else {
        switch(hyphen) {
          case '-':
            newWord = `${prefix}${lead??''}${word}`
            break;
          case '--':
            // Don't split. Save prefix information.
            prefix = `${prefix}${lead??''}${word}-`;
            prefixStart = matchStart;
            continue;
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

// function joinHyphenIterator(iterable) {
//   const empty = 0;

//   const last = iterable.reduce((prev, item) => {
//     if (!Array.isArray(item)) {
//       // header
//       yield item;
//       return prev;
//     } else {
//       // word

//       // 1. Concatenate while word has a trailing hyphen.
//       // 2.
//       // Keep the previous word.
//       if (prev !== empty) {
//         return item;
//       } else {
//         // Perform hyphenation logic here.

//       }
//       return prev;
//     }
//   }, empty)
//   return last;
// }


module.exports = {
  flattenRecording,
  fattenRecording,
  splitHyphenGenerator,
}