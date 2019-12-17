const BaseLanguage = require("../language");
const SkyUtils = require("../utils");
const path = require("path");
const fs = require("fs");
const process = require("process");
const SKYLIGHT_NUGET_FEED = "https://pkgs.dev.azure.com/UpskillSDK/dotnet-sdk/_packaging/skylight-sdk/nuget/v3/index.json";
const CURRENT_WORKING_DIRECTORY = process.cwd();

class Language extends BaseLanguage {

    get shortname() {
        return "csharp"
    }

    get name() {
        return "C#/.NET"
    }

    get aliases() {
        return ["c#", "cs", "csharp", "c-sharp"];
    }

    get examplesRepo() {
        return "skylight-netcore-sdk";
    }

    async init() {
        await super.init();
        await this.runDotnetCommand("nuget locals http-cache --clear");
        await this.runDotnetCommand("new console");
        
        //Install our nuget packages
        await this.addPackage("Skylight.Sdk", "1.0.19");
        
        //Pull down our examples
        const tags = await this.getRepoTags();
        const latestTag = tags[0];
        SkyUtils.setConfig("sdkVersion", latestTag.name);

        const ref = latestTag.commit.sha;
        await SkyUtils.downloadRepo(path.join(CURRENT_WORKING_DIRECTORY, "sdks", "cs", latestTag.name), this.examplesRepo, ref);

        //For dotnet, we need to modify the .csproj file to not include the SDKs
        const csprojFile = fs.readdirSync(CURRENT_WORKING_DIRECTORY).filter((f) => path.extname(f) === ".csproj")[0]
        const csprofFilePath = path.join(CURRENT_WORKING_DIRECTORY, csprojFile);
        var csprofFileContents = fs.readFileSync(csprofFilePath, "utf-8");
        const addBeforeLine = "</PropertyGroup>";
        const addedLine = "<DefaultItemExcludes>$(DefaultItemExcludes);sdks\\**</DefaultItemExcludes>\n";
        csprofFileContents = csprofFileContents.replace(addBeforeLine, addedLine + addBeforeLine);
        fs.writeFileSync(csprofFilePath, csprofFileContents);

        fs.writeFileSync(path.join(CURRENT_WORKING_DIRECTORY, "credentials.json"), "");
    }

    async addPackage(packageName, version, feed=SKYLIGHT_NUGET_FEED) {
        await this.runDotnetCommand(`add package ${packageName} -s ${feed} -v ${version}`)
    }

    async run() {
        const {code, error} = await this.runDotnetCommand("run");
        if(code !== -1) SkyUtils.logError(error);
    }

    async runDotnetCommand(args) {
        try {
            return await SkyUtils.runCommand("dotnet", args);
        } catch(e) {
            throw "Could not run dotnet -- please visit https://dotnet.microsoft.com/download to ensure you have the latest .NET Core SDK for your platform."
        }
    }
}

module.exports = Language;