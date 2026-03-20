/**
 * Generate sidebar icons from existing game cover images.
 * Crops center and resizes to 128x128 webp for sidebar thumbnails.
 *
 * Run: node scripts/generate-sidebar-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const GAMES_DIR = path.join(__dirname, '../public/games');
const SIZE = 128;

const TEMPLATES = [
  { template: 'werewolf',           cover: 'game-cover-werewolf.webp' },
  { template: 'mafia',              cover: 'game-cover-mafia.webp' },
  { template: 'undercover',         cover: 'game-cover-undercover.webp' },
  { template: 'tarot',              cover: 'game-cover-tarot.webp' },
  { template: 'codenames',          cover: 'game-cover-codenames.webp' },
  { template: 'avalon',             cover: 'game-cover-avalon.webp' },
  { template: 'spyfall',            cover: 'game-cover-spyfall.webp' },
  { template: 'detective',          cover: 'game-cover-detective.webp' },
  { template: 'escape-room',        cover: 'game-cover-escape-room.webp' },
  { template: 'trivia',             cover: 'game-cover-trivia.webp' },
  { template: 'debate',             cover: 'game-cover-debate.webp' },
  { template: 'storyteller',        cover: 'game-cover-storyteller.webp' },
  { template: '20-questions',       cover: 'game-cover-20-questions.webp' },
  { template: 'two-truths',         cover: 'game-cover-two-truths.webp' },
  { template: 'custom',             cover: 'game-cover-storyteller.webp' },
];

async function main() {
  let done = 0;
  let skipped = 0;

  for (const { template, cover } of TEMPLATES) {
    const src = path.join(GAMES_DIR, cover);
    const dst = path.join(GAMES_DIR, `sidebar-icon-${template}.webp`);

    if (!fs.existsSync(src)) {
      console.warn(`  SKIP ${cover} (not found)`);
      skipped++;
      continue;
    }

    await sharp(src)
      .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toFile(dst);

    const stats = fs.statSync(dst);
    console.log(`  OK  sidebar-icon-${template}.webp (${(stats.size / 1024).toFixed(1)} KB)`);
    done++;
  }

  console.log(`\nDone: ${done} icons generated, ${skipped} skipped.`);
}

main().catch(console.error);
