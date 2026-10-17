# Canvas Commons for Quarto

A Quarto extension that puts [Canvas Commons](https://github.com/canvas-commons/canvas-commons) animations in a revealjs deck. You write a scene in TypeScript, build it with Vite, and drop it on a slide with one shortcode:

```markdown
{{< canvas-commons ./animations/src/my-scene.js fullscreen=true >}}
```

The extension ships the Canvas Commons player, so a project builds only its own scenes. The animation starts when its slide is shown and pauses when you leave it.

If you use Claude Code, the [quarto-canvas-commons-skill](https://github.com/andrie/quarto-canvas-commons-skill) skills write and check the scenes for you. This repo is all you need without them.

## Start a project

You need Quarto 1.3 or later, Node 22 and `make`.

```bash
npx degit andrie/quarto-canvas-commons/template my-deck
cd my-deck
make install
make preview
```

The starter has a deck (`deck.qmd`), one scene (`animations/src/scenes/smoke.tsx`) and a `Makefile`. `make preview` builds the scenes and serves the deck, `make serve` opens the Canvas Commons editor with hot reload, and `make quarto` renders the deck.

## Add it to an existing deck

1. Install the extension in your project.

   ```bash
   quarto add andrie/quarto-canvas-commons
   ```

2. Copy `template/animations/` into your project and adapt it. It is a small Vite project that builds each scene to `dist/animations/src/<name>.js`. Keep `base: "./"` and `build.outDir: "../dist/animations"` in its `vite.config.ts`.
3. Tell Quarto to publish the built scenes, in the deck's YAML header:

   ```yaml
   format:
     revealjs:
       resources:
         - dist/**
   ```

   The glob must be `dist/**`. A shallower one such as `dist/*/*` skips `dist/animations/src/`, so the deck loads but shows empty slides once published.
4. Build the scenes (`npm --prefix animations install`, then `npm --prefix animations run build`) and render the deck.

## The shortcode

The first argument is the built scene, relative to `dist/`: write `./animations/src/my-scene.js` for the file `dist/animations/src/my-scene.js`.

| Option | Effect |
|--------|--------|
| `fullscreen=true` | Fill the slide |
| `width=50%` | Width of the player. Ignored with `fullscreen` |
| `loop=false` | Stop on the last frame instead of looping |
| `auto=false` | Do not start when the slide is shown. Click the player to play |
| `background=true` | Put the animation behind the slide's content |

A bare word means `=true`, so `fullscreen` and `fullscreen=true` are the same. Each slide handles one animation.

## Upgrading from motion-canvas

This extension was `andrie/motion-canvas`, and its shortcode was `{{< motion-canvas >}}`. The old shortcode still works and prints a warning once per render, so a deck needs no change to keep rendering. What you do need:

1. Remove `_extensions/andrie/motion-canvas`, then run `quarto add andrie/quarto-canvas-commons`. Keeping both loads two players on one page, and the second fails.
2. Delete the old player build if your project has one: a root `package.json` with a `build:player` script, `vite.player.config.ts`, `motion-canvas-ts.html`, `src/main.ts`, and the `include-in-header` line that loads `dist/motion-canvas-ts.js`. The extension ships the player now.
3. Optionally rename the shortcode in your decks.

The quarto-canvas-commons-skill repo has a script that does all of this for a project.

## How it works

`player/` builds one file, `canvas-commons-bundle.js`, which registers the `<canvas-commons-player>` element. The Lua filter adds it to any page that uses the shortcode, together with `canvas-commons-slides.js`, which starts and stops the animation as reveal.js moves between slides. The bundle also resolves scene paths against the project's `dist/` folder, using a meta tag that the filter writes with the distance from the page to the project root, so decks in a website's subdirectories work.

## Compatibility

| Extension | Canvas Commons | Quarto |
|-----------|----------------|--------|
| 0.4.x | 0.4.x | 1.3 or later |

A scene must be built with the same Canvas Commons version as the player in the extension. Pin `@canvas-commons/*` in your `animations/package.json` to the version in the table.

## Contributing

```bash
node --test tests/*.test.js     # needs quarto for the render tests
bash scripts/build-player.sh    # rebuild the bundle, then refresh template/_extensions
```

The bundle is built from `player/` and committed, and CI fails if the committed copy is stale. `template/_extensions` is a copy of `_extensions` for the starter project, kept in step by `scripts/sync-template.sh`.

To release, bump the version in `_extension.yml`, `canvas-commons.lua` (`VERSION`) and the `# >>> canvas-commons` line in `template/Makefile` (a test checks they agree), add a CHANGELOG entry, run `scripts/build-player.sh`, commit, and tag `v<version>`.
