function extract(recording) {
    let text;
    text = recording[0][0][0].map(el => (el[1] ?? el[0]));
    return text.join(' ');
}

module.exports = { extract };