
const SkyUtils = require("./utils");
const fs = require("fs");
const path = require("path");
class Language {

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

    async init(useHelloWorld=false) { 

    }

    async run() { }

    get active() {
        return true;
    }

    async getRepoTags() { 
        const tagsData = await SkyUtils.githubRequest(this.examplesRepo, "tags");
        return JSON.parse(tagsData);
    }
    
    async getSdkVersion() {}
    async setSdkVersion(version) {}

    async restoreSdkExamples() {}

    cleanDirectory() {
        SkyUtils.cleanDirectory();
    }
}

module.exports = Language;