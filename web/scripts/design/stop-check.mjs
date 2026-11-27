import {spawnSync} from 'node:child_process';
const result=spawnSync('pnpm',['exec','playwright','test'],{cwd:'web',stdio:'inherit',env:{...process.env,UI_BASE_URL:process.env.UI_BASE_URL||'http://127.0.0.1:4320'}});process.exitCode=result.status||0;
