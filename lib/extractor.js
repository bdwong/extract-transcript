function extract(recording) {
    let blocks = recording[0].map(b => {
        return b[0].map(word => (word[1] ?? word[0])).join(' ');
    });
    return blocks.join(' ');
}

module.exports = { extract };