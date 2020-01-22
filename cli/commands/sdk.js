const BaseCommand = require("../command");
const fs = require("fs");
const path = require("path");
const SkyUtils = require("../utils");
const { Select } = require('enquirer');

class Command extends BaseCommand {

    constructor() {
        super();
    }

    get description() {
        return "Show the current SDK version, or specify a version of the SDK to change to using --change (-c)."
    }

    get options() {
        const options = super.options;
        options.change = {
            alias: 'c'
            , describe: "Specify a version of the SDK to change to."
        }
        return options;
    }

    async callback({change}) {
        if(!SkyUtils.directoryIsInitialized()) throw "This directory has not been initialized as a Skylight extension folder. Please run `skytool init` to initialize this directory.";
        
        const config = SkyUtils.getConfig();
        const language = this.getLanguage(config.language);
        if(typeof language === "undefined") throw "Unknown language specified in this extension. Please ensure the skytool.config file has not been corrupted."

        var version = await language.getSdkVersion();
        console.log(`Current SDK version: ${version}`);

        if(typeof change === "boolean") change = "latest";
        if(typeof change !== "string")return;
        if(change.startsWith("v"))change = change.substring(1);

        if(version === change){
            console.log("Keeping the current version.");
            return;
        }

        console.log(`Changing version to ${change}`)
        await language.setSdkVersion(change);
        
        version = await language.getSdkVersion();
        console.log(`Updated SDK version to ${version}`);

    }

}

module.exports = Command;