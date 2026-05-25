import { API_GUIDE_DATA, API_EXAMPLES, formatApiGuideText } from '../utils/docs-data.js';

const args = process.argv.join(' ');
const isJson = args.includes('--json') || args.includes('-j') || args.includes('--ai') || process.env.npm_config_json;

if (isJson) {
    console.log(JSON.stringify({
        routes: API_GUIDE_DATA,
        examples: API_EXAMPLES
    }, null, 2));
} else {
    console.log(formatApiGuideText());
    console.log('\n\x1b[33m提示: 运行 npm run example:api -- --json 可获取结构化数据。\x1b[0m\n');
}

