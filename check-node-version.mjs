/* eslint-disable */
import { satisfies } from 'semver';
import chalk from 'chalk';
import fs from 'fs';

const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const packageJson = loadJSON('./package.json');
const version = packageJson.engines.node;
if (!satisfies(process.version, version)) {
    console.log(`${chalk.yellow('WARNING')}: ${packageJson.name} requires Node version "${chalk.green(version)}".`);
    console.log(`Your current Node version is "${chalk.red(process.version)}"`);
    console.log(`Update Nodejs to use ${packageJson.name}.`);
    process.exit(1);
}