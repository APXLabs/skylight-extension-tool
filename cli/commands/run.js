const BaseCommand = require("../command");
const SkyUtils = require("../utils");

class Command extends BaseCommand {
    get description() {
        return "Run the Skylight extension in the current working directory."
    }

    get options() {
        const options = super.options;
        return options;
    }

    async callback() {
        if(!SkyUtils.directoryIsInitialized()) throw "Please make sure the directory is initialized by running 'skytool init'."
        const config = SkyUtils.getConfig();
        const language = await this.getLanguage(config.language);
        //SkyUtils.log("Running Skylight extension from this directory.")
        await language.run();
    }
}

module.exports = Command;