import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const replacements = [
    { from: /\bFamily(?!Member)\b/g, to: 'Household' },
    { from: /\bfamily(?!(Id|Member|Name))\b/g, to: 'household' },
    { from: /\bFamilyMember\b/g, to: 'HouseholdMember' },
    { from: /\bfamilyMember\b/g, to: 'householdMember' },
    { from: /\bfamilyId\b/g, to: 'householdId' },
    { from: /\bfamilies\b/g, to: 'households' },
    { from: /\bfamilyName\b/g, to: 'householdName' },
    { from: /include:\s*\{\s*family\s*:/g, to: 'include: { household:' },
];

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.css')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }

    if (content !== original) {
        console.log(`Updated ${filePath}`);
        fs.writeFileSync(filePath, content);
    }
});
