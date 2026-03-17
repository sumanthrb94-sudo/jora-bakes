import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').filter(f => f.endsWith('.tsx') || f.endsWith('.css'));

const replacements = [
  { from: /--color-beige/g, to: '--color-bg-primary' },
  { from: /--color-cream/g, to: '--color-bg-secondary' },
  { from: /--color-primary/g, to: '--color-bg-primary' },
  { from: /--color-chocolate/g, to: '--color-text-primary' },
  { from: /--color-shadow/g, to: '--color-text-primary' },
  { from: /--color-terracotta/g, to: '--color-action-primary' },
  { from: /--color-accent/g, to: '--color-action-primary' },
  { from: /--color-sage/g, to: '--color-text-secondary' },
  { from: /--color-tertiary/g, to: '--color-text-secondary' },
  { from: /--color-gold/g, to: '--color-action-hover' },
  { from: /--color-secondary/g, to: '--color-bg-tertiary' }
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log(`Updated ${f}`);
  }
});
