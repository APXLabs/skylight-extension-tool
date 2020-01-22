const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fetch = require("node-fetch");
const process = require("process");
const {spawn} = require('child_process');
const fs = require("fs");
const atob = require("atob");
const path = require("path");
const GITHUB_ROOT = "https://api.github.com/repos/APXLabs";
const CURRENT_WORKING_DIRECTORY = process.cwd();
const SKYTOOL_CONFIG_PATH = path.join(CURRENT_WORKING_DIRECTORY, "skytool.config");
const SDK_CONFIG_NAME = "sdk.config";
var AdmZip = require('adm-zip');

module.exports = {
    SDK_FOLDER: path.join(CURRENT_WORKING_DIRECTORY, "sdks")
    , CONFIG_FILE: SKYTOOL_CONFIG_PATH
    , CREDENTIALS_FILE: path.join(CURRENT_WORKING_DIRECTORY, "credentials.json")
    , TEMPLATES_DIRECTORY: path.join(__dirname, "files")
    , async runCommand(command, args) {
        return new Promise((resolve, reject) => {
            var errorString = "";
            var result = "";

            if(!Array.isArray(args))args = args.split(" ");
            
            const source = spawn(command, args,
            {stdio: ['ignore', 'pipe', 'pipe']}); //Ignore stdin, pipe stdout and stderr
            
            source.stdout.on('data', (data) => {
                //console.log(data.toString());
                result += data.toString();
            })
            source.stderr.on('data', (data) => {
                errorString += data.toString();
            })
            source.on('error', (e) => {
                reject(e);
            })
            source.on('close', (code) => {
                resolve({code, error:errorString, result: result});
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

    async downloadRepo(toDirectoryPath, repo, ref, copyTemplate = true) {

        const downloadLink = `${GITHUB_ROOT}/${repo}/zipball/${ref}`;
        const repoZip = await fetch(downloadLink);
        fs.mkdirSync(toDirectoryPath, { recursive: true });
        const repoData = await repoZip.arrayBuffer();
        const contentsPath = path.join(toDirectoryPath, "contents.zip");
        fs.writeFileSync(contentsPath, Buffer.from(repoData));
        
        var zip = new AdmZip(contentsPath);
        zip.extractAllTo(toDirectoryPath, true);
        
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

        if(!copyTemplate)return;

        //Copy over the template
        const templatePath = path.join(repoFinalPath, sdkConfig.template);
        fs.copyFileSync(templatePath, path.join(process.cwd(), path.basename(templatePath)));
        
            
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
        const configData = JSON.parse(fs.readFileSync(SKYTOOL_CONFIG_PATH, 'utf8'));
        return configData;
    },

    log(msg) {
        console.log(msg);
    },
    
    logError(e) {
        console.log("\x1b[31m%s\x1b[0m", e);
    },
    
    cleanDirectory() {
        try {
            fs.rmdirSync(this.SDK_FOLDER, {recursive: true});
        } catch {}

        try {
            fs.unlinkSync(this.CONFIG_FILE);
        } catch {}
        
        try {
            fs.unlinkSync(this.CREDENTIALS_FILE);
        } catch {}
    }
}