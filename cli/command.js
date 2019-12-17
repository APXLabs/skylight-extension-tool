const path = require("path");
const fs = require("fs");
class Command {

    constructor() {
        this._setupLanguages();
    }

    _setupLanguages() {
        const languagesPath = path.join(__dirname, ".", "languages");
        const languages = []
        const languageFiles = fs.readdirSync(languagesPath);
        for(let languageFile of languageFiles) {
            const LanguageClass = require(path.join(languagesPath, languageFile));
            languages.push(new LanguageClass());
        }
        this.languages = languages;
    }

    getLanguage(languageQuery) {
        var language = this.languages.filter((l) => l.name === languageQuery)[0];
        if(typeof language === "undefined") language = this.languages.filter((l) => l.shortname === languageQuery)[0];
        if(typeof language === "undefined") language = this.languages.filter((l) => l.aliases.includes(language))[0];
        return language;
    }

    get description() { }

    get options() {
        return {};
    }
}

module.exports = Command;