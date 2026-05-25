import { HELP_DATA, formatHelpText } from '../utils/docs-data.js';

const args = process.argv.join(' ');
const isJson = args.includes('--json') || args.includes('-j') || args.includes('--ai') || process.env.npm_config_json;

if (isJson) {
    console.log(JSON.stringify(HELP_DATA, null, 2));
} else {
    console.log(formatHelpText());
}
