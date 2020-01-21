
const SkyUtils = require("./utils");
const fs = require("fs");
class Language {

    cleanDirectory() {
        try {
            fs.rmdirSync(SkyUtils.SDK_FOLDER, {recursive: true});
        } catch {}

        try {
            fs.unlinkSync(SkyUtils.CONFIG_FILE);
        } catch {}
        
        try {
            fs.unlinkSync(SkyUtils.CREDENTIALS_FILE);
        } catch {}
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