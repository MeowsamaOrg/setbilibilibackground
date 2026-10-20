(function () {
  const STORAGE_KEY = "bwpSettings";
  const defaults = {
    enabled: false,
    type: "image",
    source: "",
    opacity: 0.72,
    blur: 0,
    tint: 0,
    zoom: 1,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    offsetX: 0,
    offsetY: 0,
    fit: "cover",
    position: "center"
  };

  let overlay = null;
  let media = null;
  let tint = null;

  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };

  function positionValue(position, x, y) {
    const bases = {
      center: ["50%", "50%"],
      top: ["50%", "0%"],
      bottom: ["50%", "100%"],
      left: ["0%", "50%"],
      right: ["100%", "50%"]
    };
    const [baseX, baseY] = bases[position] || bases.center;
    return `calc(${baseX} + ${x}px) calc(${baseY} + ${y}px)`;
  }

  function ensureOverlay() {
    if (overlay && document.documentElement.contains(overlay)) return overlay;
    overlay = document.createElement("div");
    overlay.id = "bwp-wallpaper-overlay";
    tint = document.createElement("div");
    tint.className = "bwp-tint";
    overlay.appendChild(tint);
    (document.body || document.documentElement).prepend(overlay);
    return overlay;
  }

  function removeMedia() {
    if (!media) return;
    media.pause?.();
    media.removeAttribute("src");
    media.remove();
    media = null;
  }

  function render(rawSettings) {
    const settings = { ...defaults, ...(rawSettings || {}) };
    const source = typeof settings.source === "string" ? settings.source.trim() : "";
    const enabled = Boolean(settings.enabled && source);
    const offsetX = clamp(settings.offsetX, -500, 500, 0);
    const offsetY = clamp(settings.offsetY, -500, 500, 0);
    document.documentElement.classList.toggle("bwp-enabled", enabled);
    const root = ensureOverlay();
    removeMedia();

    if (!enabled) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    const type = settings.type === "video" ? "video" : "image";
    media = document.createElement(type === "video" ? "video" : "div");
    media.className = "bwp-wallpaper-media";
    const visualPosition = positionValue(settings.position, offsetX, offsetY);
    const fit = ["cover", "contain", "fill"].includes(settings.fit) ? settings.fit : "cover";
    const zoom = clamp(settings.zoom, 1, 2, 1);

    if (type === "video") {
      media.src = source;
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
      media.setAttribute("aria-hidden", "true");
      media.style.objectFit = fit;
      media.style.objectPosition = visualPosition;
      const currentMedia = media;
      currentMedia.addEventListener("error", () => {
        if (media === currentMedia) currentMedia.hidden = true;
      }, { once: true });
    } else {
      media.style.backgroundImage = `url(${JSON.stringify(source)})`;
      media.style.backgroundSize = fit === "fill" ? "100% 100%" : fit;
      media.style.backgroundPosition = visualPosition;
      media.style.backgroundRepeat = "no-repeat";
    }

    media.style.opacity = String(clamp(settings.opacity, 0, 1, defaults.opacity));
    media.style.filter = [
      `blur(${clamp(settings.blur, 0, 40, 0)}px)`,
      `brightness(${clamp(settings.brightness, 0.5, 1.5, 1)})`,
      `contrast(${clamp(settings.contrast, 0.5, 1.5, 1)})`,
      `saturate(${clamp(settings.saturation, 0, 2, 1)})`
    ].join(" ");
    media.style.transform = `scale(${zoom})`;
    tint.style.background = `rgba(0, 0, 0, ${clamp(settings.tint, 0, 0.8, 0)})`;
    root.insertBefore(media, tint);
    if (type === "video") media.play().catch(() => {});
  }

  chrome.storage.local.get(STORAGE_KEY)
    .then((result) => render(result[STORAGE_KEY]))
    .catch(() => render(defaults));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) render(changes[STORAGE_KEY].newValue);
  });

  const observer = new MutationObserver(() => {
    if (overlay && !document.documentElement.contains(overlay)) {
      overlay = null;
      chrome.storage.local.get(STORAGE_KEY).then((result) => render(result[STORAGE_KEY])).catch(() => {});
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
