
function topHeader() {
    return { level: 0, type: "top", version: "1.0" };
}

function blockArrayHeader() {
    return { level: 1, type: "blockArray" };
}

function blockHeader(block) {
    return { level: 2, type: "block", isNewLocale: block[1], locale: block[2] };
}

function flattenRecording(recording) {
  const flatRecording = [];
  const blockArray = recording[0];
  flatRecording.push(topHeader());
  flatRecording.push(blockArrayHeader());
  blockArray.forEach((block) => {
    flatRecording.push(blockHeader(block));
    block[0].forEach((word) => {
        flatRecording.push(word);
    });
  });
  return flatRecording;
}

module.exports = {
    flattenRecording
}