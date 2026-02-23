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
    { from: /\bstartsAt\b/g, to: 'startDate' },
    { from: /\bendsAt\b/g, to: 'endDate' },
    { from: /\bimageUrl\b/g, to: 'coverImageUrl' },
    { from: /\btotalAmount\b/g, to: 'totalCents' },
    { from: /\bcustomerEmail\b/g, to: 'purchaserEmail' },
    { from: /\bcustomerName\b/g, to: 'purchaserName' },
    { from: /\bcustomerPhone\b/g, to: 'purchaserPhone' },
    { from: /\bsoldCount\b/g, to: 'quantitySold' },
    { from: /\brawPayload\b/g, to: 'rawPayloadJson' },
    { from: /\bevent\.location\b/g, to: 'event.locationName' },
    { from: /\bsetStartsAt\b/g, to: 'setStartDate' },
    { from: /\bsetEndsAt\b/g, to: 'setEndDate' },
    { from: /\bsetLocation\b/g, to: 'setLocationName' },
];

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

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
