/* eslint-disable */
const semver = require('semver');
const chalk = require('chalk');
const json = require("./package");

const version = json.engines.node;
if (!semver.satisfies(process.version, version)) {
    console.log(`${chalk.yellow('WARNING')}: ${json.name} requires Node version "${chalk.green(version)}".`);
    console.log(`Your current Node version is "${chalk.red(process.version)}"`);
    console.log(`Update Nodejs to use ${json.name}.`);
    process.exit(1);
}