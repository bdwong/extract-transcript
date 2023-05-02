const { resolveConfig } = require('appyconfig');

// TODO: add argument for frequency of timestamp (timestamp period).
const config_tree = {
}

const config = resolve_config(config_tree);
module.exports = config;
