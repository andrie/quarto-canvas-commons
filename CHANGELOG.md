# Changelog

## 0.4.0

First standalone release. It continues the `motion-canvas` extension that lived in the quarto-canvas-commons-skill repo (last version there: 0.3.0).

- The extension is now `canvas-commons`, with the shortcode `{{< canvas-commons >}}`. The old `{{< motion-canvas >}}` shortcode still works and prints a warning once per render. Install the new extension and remove `_extensions/andrie/motion-canvas`: the two define the same player and cannot be loaded together.
- It ships the Canvas Commons player (`canvas-commons-bundle.js`), so a project no longer builds it and no longer needs the `include-in-header` script tag.
- `width=50%` now works. It was written outside the `style` attribute and never applied. The player gets one `style` attribute, or none.
- `auto=false` stops an animation starting when its slide is shown. Without it the animation starts on arrival, as before.
- Scene paths resolve against the project's `dist/` folder, also for pages in a subdirectory of a website.
- Leaving a slide pauses its animation instead of toggling it, so a finished `loop=false` scene no longer restarts.
- A starter project in `template/`.
