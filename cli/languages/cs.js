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

    cleanDirectory() {
        super.cleanDirectory();
        try {
            fs.rmdirSync("obj", {recursive: true});
        } catch {}

        
        try {
            fs.unlinkSync("Program.cs")
        } catch {}
        
        const dirName = path.basename(path.resolve());
        try {
            fs.unlinkSync(`${dirName}.csproj`);
        } catch {}
    }

    async init() {
        await super.init();

        
        SkyUtils.log("Clearing NuGet cache.");
        await this.runDotnetCommand("nuget locals http-cache --clear");
        
        SkyUtils.log("Creating new C# console application.");
        await this.runDotnetCommand("new console");
        
        //Install our nuget packages
        SkyUtils.log("Installing NuGet packages.");
        await this.addPackage("Skylight.Sdk");
        
        //Pull down our examples
        const tags = await this.getRepoTags();

        //We'll use the latest SDK
        const latestTag = tags[0];

        //SkyUtils.setConfig("sdkVersion", latestTag.name);

        const ref = latestTag.commit.sha;
        SkyUtils.log("Downloading C# SDK examples.");
        await SkyUtils.downloadRepo(path.join(CURRENT_WORKING_DIRECTORY, "sdks", "cs", latestTag.name), this.examplesRepo, ref);

        //For dotnet, we need to modify the .csproj file to not include the SDKs
        SkyUtils.log("Modifying .csproj file.");
        const csprojFile = fs.readdirSync(CURRENT_WORKING_DIRECTORY).filter((f) => path.extname(f) === ".csproj")[0]
        const csprofFilePath = path.join(CURRENT_WORKING_DIRECTORY, csprojFile);
        var csprofFileContents = fs.readFileSync(csprofFilePath, "utf-8");
        const addBeforeLine = "</PropertyGroup>";
        const addedLine = "<DefaultItemExcludes>$(DefaultItemExcludes);sdks\\**</DefaultItemExcludes>\n";
        csprofFileContents = csprofFileContents.replace(addBeforeLine, addedLine + addBeforeLine);
        fs.writeFileSync(csprofFilePath, csprofFileContents);
    }

    async addPackage(packageName, version = null, feed=SKYLIGHT_NUGET_FEED) {
        const versionString = version == null ? "" : ` -v ${version}`;
        const addPackageCommand = `add package ${packageName} -s ${feed}${versionString}`;
        await this.runDotnetCommand(addPackageCommand)
    }

    async run() {
        //We provide the user with instructions on how to run this extension, rather than running it for them, as user input gets blocked
        SkyUtils.log("Run this extension by entering the command `dotnet run` in this directory.");
    }

    async runDotnetCommand(args) {
        try {
            return await SkyUtils.runCommand("dotnet", args);
        } catch(e) {
            throw "Could not run dotnet -- please visit https://dotnet.microsoft.com/download to ensure you have the latest .NET Core SDK for your platform."
        }
    }

    async getSdkVersion() {
            const packagesList = await this.runDotnetCommand("list package");
            const results = /Skylight\.Sdk\s*([0-9]+\.[0-9]+\.[0-9]+)/.exec(packagesList.result);
            return results[1];
    }

    async setSdkVersion(version) {
        if(typeof version === "undefined" || version === "latest") {
            version = null;
        }

        await this.addPackage("Skylight.Sdk", version);
        await this.restoreSdkExamples();
    }

    async restoreSdkExamples() {
        const version = await this.getSdkVersion();
        
        //Pull down our examples
        const tags = await this.getRepoTags();

        //We'll use the latest SDK
        const versionTag = tags.filter((t) => { return t.name === "v"+version})[0];
        if(typeof versionTag === "undefined") throw "Examples not found for this SDK version";

        try {
            SkyUtils.log("Removing SDKs folder.");
            fs.rmdirSync(SkyUtils.SDK_FOLDER, {recursive: true});
        } catch {}

        const ref = versionTag.commit.sha;
        SkyUtils.log("Restoring C# SDK examples.");
        await SkyUtils.downloadRepo(path.join(CURRENT_WORKING_DIRECTORY, "sdks", "cs", versionTag.name), this.examplesRepo, ref, false);

    }
}

module.exports = Language;