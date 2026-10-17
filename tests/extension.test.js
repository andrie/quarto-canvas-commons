import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ext = path.join(repo, '_extensions/andrie/canvas-commons');
const read = (...p) => fs.readFileSync(path.join(repo, ...p), 'utf8');
const hasQuarto = spawnSync('quarto', ['--version']).status === 0;

test('the extension, the Lua and the starter Makefile carry one version', () => {
  const yml = read('_extensions/andrie/canvas-commons/_extension.yml').match(/^version:\s*(\S+)/m)[1];
  assert.equal(read('_extensions/andrie/canvas-commons/canvas-commons.lua').match(/local VERSION = "([^"]+)"/)[1], yml);
  assert.equal(read('template/Makefile').match(/^# >>> canvas-commons (\S+)/m)[1], yml);
  assert.match(read('CHANGELOG.md'), new RegExp(`^## ${yml.replace(/\./g, '\\.')}\\b`, 'm'), 'the changelog has an entry for this version');
});

test('template/_extensions is a copy of _extensions', () => {
  execFileSync('bash', [path.join(repo, 'scripts/sync-template.sh'), '--check']);
});

test('the bundle defines the player and resolves scene paths against the project dist/', () => {
  const bundle = fs.readFileSync(path.join(ext, 'canvas-commons-bundle.js'), 'utf8');
  assert.match(bundle, /canvas-commons-player/);
  assert.match(bundle, /canvas-commons:offset/);
  assert.match(bundle, /dist\//);
});

test('the starter project has the pieces a first build needs', () => {
  for (const f of ['Makefile', 'deck.qmd', '.gitignore', 'animations/package.json', 'animations/vite.config.ts', 'animations/src/smoke.ts', 'animations/src/scenes/smoke.tsx']) {
    assert.ok(fs.existsSync(path.join(repo, 'template', f)), f);
  }
  assert.match(read('template/deck.qmd'), /\{\{< canvas-commons \.\/animations\/src\/smoke\.js/);
  assert.doesNotMatch(read('template/deck.qmd'), /include-in-header|motion-canvas/);
});

function render(fixture) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-ext-'));
  fs.copyFileSync(path.join(repo, 'tests/fixtures', fixture), path.join(dir, fixture));
  fs.cpSync(path.join(repo, '_extensions'), path.join(dir, '_extensions'), {recursive: true});
  const r = spawnSync('quarto', ['render', fixture], {cwd: dir, encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(path.join(dir, fixture.replace(/\.qmd$/, '.html')), 'utf8');
  return {dir, html, log: r.stdout + r.stderr, players: html.match(/<canvas-commons-player[^>]*>/g)};
}

test('shortcode options become attributes and one style attribute', {skip: !hasQuarto && 'quarto is not installed'}, () => {
  const {dir, players} = render('shortcodes.qmd');
  const by = (name) => players.find((p) => p.includes(`/${name}.js`));
  assert.equal(by('plain'), '<canvas-commons-player src="./animations/src/plain.js">');
  assert.match(by('width'), /style="width:50%;"/, 'width goes inside style');
  assert.doesNotMatch(players.join('').replace(/style="[^"]*"/g, ''), /width:/, 'no bare width attribute outside style');
  assert.match(by('full'), /loop="false" style="position:absolute; top:0; width:100%;"/);
  assert.match(by('manual'), /auto="false"/);
  assert.match(by('back'), /auto="true" style="z-index:-1;"/);
  for (const p of players) assert.equal((p.match(/\bstyle=/g) ?? []).length <= 1, true, p);
  fs.rmSync(dir, {recursive: true});
});

test('the old motion-canvas shortcode still works and warns once', {skip: !hasQuarto && 'quarto is not installed'}, () => {
  const {dir, players, log} = render('shortcodes.qmd');
  assert.ok(players.some((p) => p.includes('/old.js')));
  assert.equal((log.match(/shortcode is now/g) ?? []).length, 1);
  fs.rmSync(dir, {recursive: true});
});

test('the deck loads the bundle before the slide script, once', {skip: !hasQuarto && 'quarto is not installed'}, () => {
  const {dir, html} = render('shortcodes.qmd');
  const scripts = [...html.matchAll(/<script src="([^"]*canvas-commons-[a-z]+\.js)"/g)].map((m) => path.basename(m[1]));
  assert.deepEqual(scripts, ['canvas-commons-bundle.js', 'canvas-commons-slides.js']);
  fs.rmSync(dir, {recursive: true});
});

test('the player learns how far the page is from the project root', {skip: !hasQuarto && 'quarto is not installed'}, () => {
  const {dir, html} = render('shortcodes.qmd');
  assert.match(html, /<meta name="canvas-commons:offset" content=".\/">/);
  fs.rmSync(dir, {recursive: true});

  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-site-'));
  fs.cpSync(path.join(repo, 'tests/fixtures/site'), site, {recursive: true});
  fs.cpSync(path.join(repo, '_extensions'), path.join(site, '_extensions'), {recursive: true});
  const r = spawnSync('quarto', ['render'], {cwd: site, encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(path.join(site, '_site/pages/talk.html'), 'utf8'), /<meta name="canvas-commons:offset" content="..\/">/);
  fs.rmSync(site, {recursive: true});
});

test('the licence and the third-party notices for the bundle are present', () => {
  assert.match(read('LICENSE'), /^MIT License/);
  const notices = read('_extensions/andrie/canvas-commons/THIRD-PARTY-NOTICES.md');
  for (const pkg of ['@canvas-commons/core', '@canvas-commons/player']) assert.ok(notices.includes(`## ${pkg} `), pkg);
});
