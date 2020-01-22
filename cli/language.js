
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

    async init() { 

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
}

module.exports = Language;