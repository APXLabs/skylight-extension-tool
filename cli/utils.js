const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fetch = require("node-fetch");
const process = require("process");
const {spawn} = require('child_process');
const fs = require("fs");
const atob = require("atob");
const path = require("path");
const unzipper = require("unzipper");
const GITHUB_ROOT = "https://api.github.com/repos/APXLabs";
const SKYTOOL_CONFIG_PATH = path.join(process.cwd(), "skytool.config");
const SDK_CONFIG_NAME = "sdk.config";

module.exports = {
    async runCommand(command, args) {
        return new Promise((resolve, reject) => {
            var errorString = "";

            if(!Array.isArray(args))args = args.split(" ");
            
            const source = spawn(command, args,
            {stdio: ['ignore', 'pipe', 'pipe']}); //Ignore stdin, pipe stdout and stderr
            
            source.stdout.on('data', (data) => {
                console.log(data.toString());
            })
            source.stderr.on('data', (data) => {
                errorString += data.toString();
            })
            source.on('error', (e) => {
                reject();
            })
            source.on('close', (code) => {
                resolve({code, error:errorString});
            })
        })
    }, 

    async githubRequest(repo, path, ref){
        var fetchUrl = `${GITHUB_ROOT}/${repo}/${path}`;
        if(typeof ref !== "undefined") fetchUrl += `?ref=${ref}`;
        const response = await fetch(fetchUrl);
        return await response.text();
    },

    async githubContentRequest(repo, path, ref) {
        const response = JSON.parse(await this.githubRequest(repo, path, ref));
        return atob(response.content);
    },

    async getRepoConfig(repo, ref) {
        const configData = await this.githubContentRequest(repo, `contents/${SDK_CONFIG_NAME}`, ref);
        const config = JSON.parse(configData);
        return config;
    },

    async downloadRepo(toDirectoryPath, repo, ref) {
        const downloadLink = `${GITHUB_ROOT}/${repo}/zipball/${ref}`;
        const repoZip = await fetch(downloadLink);
        fs.mkdirSync(toDirectoryPath, { recursive: true });
        const repoData = await repoZip.arrayBuffer();
        const contentsPath = path.join(toDirectoryPath, "contents.zip");
        fs.writeFileSync(contentsPath, Buffer.from(repoData));
        fs.createReadStream(contentsPath)
            .pipe(unzipper.Extract({ path: toDirectoryPath })).on("close", () => {
                fs.unlinkSync(contentsPath);

                //Look for the folder and rename it
                const repoFolderPath = this.getRepoFolderInDirectory(toDirectoryPath);
                if(typeof repoFolderPath === "undefined")return;
                const repoFinalPath = path.join(toDirectoryPath, "repo");
                fs.renameSync(repoFolderPath, repoFinalPath);

                //Get the config for this sdk
                const sdkConfig = JSON.parse(fs.readFileSync(path.join(repoFinalPath, SDK_CONFIG_NAME)));

                //Remove any unnecessary files
                const keepFiles = sdkConfig.keep;
                const sdkFiles = fs.readdirSync(repoFinalPath);
                for(let file of sdkFiles) {
                    if(keepFiles.includes(file))continue;
                    if(file === SDK_CONFIG_NAME)continue;
                    const filePath = path.join(repoFinalPath, file);
                    const fileStat = fs.statSync(filePath);
                    if(fileStat.isDirectory())fs.rmdirSync(filePath, { recursive: true });
                    else { fs.unlinkSync(filePath); }
                }

                //Copy over the template
                const templatePath = path.join(repoFinalPath, sdkConfig.template);
                fs.copyFileSync(templatePath, path.join(process.cwd(), path.basename(templatePath)));
            });

    },

    getRepoFolderInDirectory(directory) {
        const possibleFolders = fs.readdirSync(directory);
        for(let folder of possibleFolders) {
            const folderPath = path.join(directory, folder);
            if(this.folderIsSDKDirectory(folderPath))return folderPath;
        }
    },

    folderIsSDKDirectory(directory) {
        const dirStat = fs.statSync(directory);
        if(!dirStat.isDirectory())return false;
        const files = fs.readdirSync(directory);
        return files.includes(SDK_CONFIG_NAME);
    },
    
    directoryIsInitialized() {
        return fs.existsSync(SKYTOOL_CONFIG_PATH);
    },
    
    directoryIsEmpty() {
        return fs.readdirSync(process.cwd()).length === 0
    },

    setConfig(key, value) {
        var configData = {};
        try {
            configData = this.getConfig();
        } catch {}
        configData[key] = value;
        fs.writeFileSync(SKYTOOL_CONFIG_PATH, JSON.stringify(configData));
    },

    getConfig() {
        const configData = JSON.parse(fs.readFileSync(SKYTOOL_CONFIG_PATH));
        return configData;
    },
    
    logError(e) {
        console.log("\x1b[31m%s\x1b[0m", e);
    }
}