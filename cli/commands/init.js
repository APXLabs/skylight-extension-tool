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
        options.force = {
            alias: 'f'
            , describe: "Force the initialization process to overwrite any previous initializations of Skylight extensions in this folder."
        }
        options.verbose = {
            alias: 'v'
            , describe: "Run the init command in verbose mode."
        }
        options.helloworld = {
            describe: "Start with the HelloWorld example as a template."
        }
        return options;
    }

    async callback({language, force, verbose, helloworld}) {
        if(!force && SkyUtils.directoryIsInitialized()) throw "This directory has already been initialized as a Skylight extension folder. If you would like to create a new extension, please change to an empty directory or rerun this command with the --force (-f) flag.";
        if(typeof verbose === "undefined")verbose = false;
        SkyUtils.setVerbose(verbose);
        /* Remove this until another language other than C# is supported
        //If no language was specified, prompt the user for one
        if(typeof language === "undefined") {
            const languagePrompt = new Select({
                name: 'language',
                message: 'Select a language for this project',
                choices: this.languages.filter((l) => l.active).map((l) => l.name)
              });
            language = await languagePrompt.run();
        }
        */
        language = "csharp";
        language = this.getLanguage(language);
        if(typeof language === "undefined") throw "Unknown language specified. Valid options are: \n" + this.languagesDescriptionString;

        SkyUtils.log("Initializing directory as Skylight extension.");
        SkyUtils.log("Cleaning directory.");
        language.cleanDirectory();
        try {
            fs.mkdirSync(SkyUtils.APPCONFIG_DIRECTORY);
        } catch {}
        fs.writeFileSync(SkyUtils.CREDENTIALS_FILE, "<Replace the contents of this file with the API credentials JSON from Skylight Web>");
        fs.copyFileSync(path.join(SkyUtils.TEMPLATES_DIRECTORY, "gitignore"), path.join(process.cwd(), ".gitignore"));

        await language.init(helloworld);
        SkyUtils.setConfig("language", language.shortname);
        SkyUtils.log("Skylight extension initialized.");

    }

}

module.exports = Command;