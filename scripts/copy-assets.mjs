import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
await mkdir('dist/app/ui', { recursive: true });
for (const file of ['index.html', 'styles.css']) {
  if (existsSync(`app/ui/${file}`)) await copyFile(`app/ui/${file}`, `dist/app/ui/${file}`);
}
await mkdir('dist/app/ui/shared', { recursive: true });
await copyFile('dist/app/shared/feedback-validation.js', 'dist/app/ui/shared/feedback-validation.js');
