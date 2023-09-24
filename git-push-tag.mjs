import fs from 'fs';
import { exec } from 'child_process';
import chalk from 'chalk';

const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const packageJson = loadJSON('./package.json');
const remote = process.argv.length > 2 ? process.argv.slice(2)[0] : undefined;

getRemoteUrl(remote)
    .then( remoteUrl => {
        console.log(
            chalk.yellow("pushing git tag"),
            chalk.green(`v${packageJson.version}`),
            remoteUrl
        );
    })
    .then( () => {
        const version = packageJson.version;
        if(!version) throw new Error('package.json does not have version attribute');
        return gitPush(`v${version}`, remote);
    })
    .then( result => {
        console.log(chalk.yellow("==== git push completed ==="));
        console.log(result);
    })
    .catch( err => {
        console.log(chalk.red(err));
    })



function getRemoteUrl(remote = 'origin') {
    return new Promise( (resolve, reject) => {
            exec(`git remote get-url ${remote}`, (err, data) => {
                if(err) reject(err);
                else resolve(data);
            });
        });
}

function gitPush(tag, remote = 'origin'){
    return new Promise( (resolve, reject) => {
        exec(`git push ${remote} ${tag}`, (err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    });
}