import '@canvas-commons/core';
import '@canvas-commons/player';

// The player imports `src` relative to this script, which Quarto copies into the deck's support folder.
// Resolve relative scene paths against the project's dist/ folder instead, so a shortcode path of
// ./animations/src/x.js means dist/animations/src/x.js. The Lua adds a meta tag with the distance from
// the current page to the project root, which is not "./" for a page in a subdirectory of a website.
const Player = customElements.get('canvas-commons-player') as
  | (CustomElementConstructor & { prototype: { updateSource(src: string): Promise<void> } })
  | undefined;

if (Player) {
  const updateSource = Player.prototype.updateSource;
  Player.prototype.updateSource = function (src: string) {
    const offset = document.querySelector('meta[name="canvas-commons:offset"]')?.getAttribute('content') ?? './';
    const resolved = /^([a-z][a-z0-9+.-]*:|\/)/i.test(src)
      ? src
      : new URL(src, new URL(`${offset}dist/`, document.baseURI)).href;
    return updateSource.call(this, resolved);
  };
}
