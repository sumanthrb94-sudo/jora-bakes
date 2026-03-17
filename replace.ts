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
  { from: /src\/components\/Layout\.tsx/g, to: '--color-brand-dark' },
  { from: /--color-brand-dark/g, to: '--color-chocolate' },
  { from: /--color-brand-beige/g, to: '--color-beige' },
  { from: /--color-brand-terracotta/g, to: '--color-terracotta' },
  { from: /--color-brand-cream/g, to: '--color-cream' },
  { from: /--color-brand-sage/g, to: '--color-sage' },
  { from: /font-script/g, to: 'font-script' },
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
