(function () {
  const STORAGE_KEY = "bwpSettings";
  const defaults = {
    enabled: false,
    type: "image",
    source: "",
    opacity: 0.72,
    blur: 0,
    fit: "cover",
    position: "center",
    tint: 0
  };

  let overlay = null;
  let media = null;
  let tint = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "bwp-wallpaper-overlay";
    tint = document.createElement("div");
    tint.className = "bwp-tint";
    overlay.appendChild(tint);
    (document.body || document.documentElement).prepend(overlay);
    return overlay;
  }

  function removeMedia() {
    if (media) {
      media.pause?.();
      media.removeAttribute("src");
      media.remove();
      media = null;
    }
  }

  function render(rawSettings) {
    const settings = { ...defaults, ...(rawSettings || {}) };
    document.documentElement.classList.toggle("bwp-enabled", Boolean(settings.enabled && settings.source));
    ensureOverlay();
    removeMedia();

    if (!settings.enabled || !settings.source) {
      overlay.hidden = true;
      return;
    }

    overlay.hidden = false;
    media = document.createElement(settings.type === "video" ? "video" : "div");
    media.className = "bwp-wallpaper-media";
    if (settings.type === "video") {
      media.src = settings.source;
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
      media.setAttribute("aria-hidden", "true");
    } else {
      media.style.backgroundImage = `url(${JSON.stringify(settings.source)})`;
      media.style.backgroundSize = settings.fit;
      media.style.backgroundPosition = settings.position;
      media.style.backgroundRepeat = "no-repeat";
    }
    media.style.opacity = String(Math.max(0, Math.min(1, Number(settings.opacity) || 0)));
    media.style.filter = `blur(${Math.max(0, Number(settings.blur) || 0)}px)`;
    media.style.objectFit = settings.fit;
    media.style.objectPosition = settings.position;
    tint.style.background = `rgba(0, 0, 0, ${Math.max(0, Math.min(0.8, Number(settings.tint) || 0))})`;
    overlay.insertBefore(media, tint);
    if (settings.type === "video") media.play().catch(() => {});
  }

  chrome.storage.local.get(STORAGE_KEY).then((result) => render(result[STORAGE_KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[STORAGE_KEY]) render(changes[STORAGE_KEY].newValue);
  });
})();
