const BaseLanguage = require("../language");

class Language extends BaseLanguage {

    get shortname() {
        return "javascript"
    }

    get name() {
        return "Javascript/NodeJS"
    }

    get aliases() {
        return ["js", "javascript", "nodejs"];
    }

    async init(useHelloWorld=false) {
        throw "Javascript is currently unsupported."
    }

    get active() {
        return false;
    }
}

module.exports = Language;