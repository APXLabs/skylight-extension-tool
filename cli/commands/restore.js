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
        return "Restores SDK examples and credentials.json file."
    }

    get options() {
        const options = super.options;
        return options;
    }

    async callback({}) {
        if(!SkyUtils.directoryIsInitialized()) throw "This directory has not been initialized as a Skylight extension folder. Please run `skytool init` to initialize this directory.";
        
        const config = SkyUtils.getConfig();
        const language = this.getLanguage(config.language);
        if(typeof language === "undefined") throw "Unknown language specified in this extension. If the skytool.config file has been corrupted, please revert it to an earlier version."
        
        if(!fs.existsSync(SkyUtils.CREDENTIALS_FILE)) {
            SkyUtils.log("Restoring credentials file.");
            fs.writeFileSync(SkyUtils.CREDENTIALS_FILE, "<Replace the contents of this file with the API credentials JSON from Skylight Web>");
        }
        await language.restoreSdkExamples();
        SkyUtils.log("Restoration complete.");
        
    }

}

module.exports = Command;