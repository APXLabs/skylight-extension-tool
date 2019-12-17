#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const SkyUtils = require("./utils");

const COMMANDS_PATH = path.join(__dirname, "commands");

const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')

const commands = fs.readdirSync(COMMANDS_PATH);
for(let commandFile of commands) {
    const commandFilePath = path.join(COMMANDS_PATH, commandFile);
    const CommandClass = require(commandFilePath);
    const command = new CommandClass();
    const commandName = path.basename(commandFile, path.extname(commandFile));

    //For each of our commands, load it into yargs
    argv.command(commandName, command.description, command.options, async (...args) => { try {
        await command.callback(...args);
     } catch(e) {
         SkyUtils.logError(e);
     } });
}

argv.help('h').alias('h', 'help').argv