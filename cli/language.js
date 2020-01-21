
const SkyUtils = require("./utils");
const fs = require("fs");
class Language {

    cleanDirectory() {
        fs.rmdirSync(SkyUtils.SDK_FOLDER, {recursive: true});
        fs.unlinkSync(SkyUtils.CONFIG_FILE);
        fs.unlinkSync(SkyUtils.CREDENTIALS_FILE);
    }

    get shortname() {
        return "";
    }
    
    get examplesRepo() {
        return "";
    }

    get name() {
        return "";
    }

    get aliases() {
        return [];
    }

    async init() { 
        this.cleanDirectory();
        fs.writeFileSync(SkyUtils.CREDENTIALS_FILE, "");
    }

    async run() { }

    get active() {
        return true;
    }

    async getRepoTags() { 
        const tagsData = await SkyUtils.githubRequest(this.examplesRepo, "tags");
        return JSON.parse(tagsData);
    }
}

module.exports = Language;