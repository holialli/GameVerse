const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const recoveryBase = 'c:\\Users\\ali13\\Desktop\\Projects\\GameVerse\\GameVerse\\_RECOVERY_TEMP';

if (!fs.existsSync(historyDir)) {
    console.error("No VS Code history found.");
    process.exit(1);
}

if (!fs.existsSync(recoveryBase)) {
    fs.mkdirSync(recoveryBase, { recursive: true });
}

const folders = fs.readdirSync(historyDir);

let recoveredCount = 0;

for (const folder of folders) {
    const folderPath = path.join(historyDir, folder);
    const entriesPath = path.join(folderPath, 'entries.json');
    if (fs.existsSync(entriesPath)) {
        try {
            const entriesData = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
            const resource = entriesData.resource; 
            
            if (resource && resource.includes('GameVerse')) {
                // Parse file uri
                let targetPath = resource.replace('file:///', '').replace('vscode-file://vscode-app/', '');
                targetPath = decodeURIComponent(targetPath);
                
                // only paths belonging to the project
                if (targetPath.toLowerCase().includes('gameverse\\gameverse') || targetPath.toLowerCase().includes('gameverse/gameverse')) {
                    
                    // Grab the actual project relative path
                    let relativeStr = targetPath.substring(targetPath.toLowerCase().indexOf('gameverse\\gameverse') + 20);
                    if (relativeStr.startsWith('\\') || relativeStr.startsWith('/')) relativeStr = relativeStr.substring(1);
                    
                    const entries = entriesData.entries || [];
                    if (entries.length > 0) {
                        // find the newest backup in entries
                        let latestEntry = entries[entries.length - 1]; 
                        let backupPath = path.join(folderPath, latestEntry.id);
                        
                        if (fs.existsSync(backupPath)) {
                            const destPath = path.join(recoveryBase, relativeStr);
                            const dirName = path.dirname(destPath);
                            fs.mkdirSync(dirName, { recursive: true });
                            fs.copyFileSync(backupPath, destPath);
                            recoveredCount++;
                        }
                    }
                }
            }
        } catch (e) {
            // ignore JSON parse/read errors for individual files
        }
    }
}
console.log(`Successfully recovered ${recoveredCount} files to _RECOVERY_TEMP folder.`);
