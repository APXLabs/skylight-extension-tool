const BaseCommand = require("../command");
const fs = require("fs");
const path = require("path");
const SkyUtils = require("../utils");
const { Select } = require('enquirer');

class Command extends BaseCommand {

    constructor() {
        super();
        this.languagesDescriptionString = this.languages.map((language) => {
            const languageAliases = language.aliases;
            return `[${languageAliases.join(", ")}] => ${language.name}`
        }).reduce((previous = "", current) => `${previous}\n${current}`);
    }

    get description() {
        return "Initialize the current working directory as a Skylight extension."
    }

    get options() {
        const options = super.options;
        options.language = {
            alias: 'l'
            , describe: "Specify the language you would like to use.\n" + this.languagesDescriptionString
        }
        return options;
    }

    async callback({language}) {
        if(SkyUtils.directoryIsInitialized()) throw "This directory has already been initialized as a Skylight extension folder. If you would like to create a new extension, please change to an empty directory.";
        if(!SkyUtils.directoryIsEmpty()) throw "This directory is not empty. If you would like to create a new extension, please empty this directory or change to a new empty directory.";

        //If no language was specified, prompt the user for one
        if(typeof language === "undefined") {
            const languagePrompt = new Select({
                name: 'language',
                message: 'Select a language for this project',
                choices: this.languages.filter((l) => l.active).map((l) => l.name)
              });
            language = await languagePrompt.run();
        }
        language = this.getLanguage(language);
        if(typeof language === "undefined") throw "Unknown language specified. Valid options are: \n" + this.languagesDescriptionString;

        //Create the config file
        SkyUtils.setConfig("language", language.shortname);
        await language.init();

    }

}

module.exports = Command;