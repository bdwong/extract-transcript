const { resolveConfig } = require('appyconfig');

// TODO: add argument for frequency of timestamp (timestamp period).
const config_tree = {
}

const config = resolveConfig(config_tree);
module.exports = config;
