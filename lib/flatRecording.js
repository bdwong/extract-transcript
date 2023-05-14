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
      console.log(`header: ${util.inspect(header)}`);
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

module.exports = {
  flattenRecording,
  fattenRecording,
}