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
let settings = { ...defaults };
let saveTimer;

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};
const normalizeSettings = (raw) => {
  const value = { ...defaults, ...(raw || {}) };
  return {
    ...value,
    enabled: Boolean(value.enabled),
    type: value.type === "video" ? "video" : "image",
    source: typeof value.source === "string" ? value.source.trim() : "",
    opacity: clamp(value.opacity, 0, 1, defaults.opacity),
    blur: clamp(value.blur, 0, 40, defaults.blur),
    tint: clamp(value.tint, 0, 0.8, defaults.tint),
    zoom: clamp(value.zoom, 1, 2, defaults.zoom),
    brightness: clamp(value.brightness, 0.5, 1.5, defaults.brightness),
    contrast: clamp(value.contrast, 0.5, 1.5, defaults.contrast),
    saturation: clamp(value.saturation, 0, 2, defaults.saturation),
    offsetX: clamp(value.offsetX, -500, 500, defaults.offsetX),
    offsetY: clamp(value.offsetY, -500, 500, defaults.offsetY),
    fit: ["cover", "contain", "fill"].includes(value.fit) ? value.fit : defaults.fit,
    position: ["center", "top", "bottom", "left", "right"].includes(value.position) ? value.position : defaults.position
  };
};

function announce(text, error = false) {
  $("message").textContent = text;
  $("message").style.color = error ? "#ff8792" : "#69d5a2";
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => { $("message").textContent = ""; }, 2600);
}

function positionValue(position, x, y) {
  const bases = {
    center: ["50%", "50%"], top: ["50%", "0%"], bottom: ["50%", "100%"],
    left: ["0%", "50%"], right: ["100%", "50%"]
  };
  const [baseX, baseY] = bases[position] || bases.center;
  return `calc(${baseX} + ${x}px) calc(${baseY} + ${y}px)`;
}

function updatePreview() {
  const host = $("preview-media");
  host.replaceChildren();
  $("preview-empty").hidden = Boolean(settings.source);
  $("source-status").textContent = settings.source ? `${settings.type === "video" ? "视频" : "图片"}已设置` : "未设置";
  host.style.backgroundImage = "none";
  if (!settings.source) return;

  const media = settings.type === "video" ? document.createElement("video") : document.createElement("div");
  media.style.opacity = String(settings.opacity);
  media.style.filter = `blur(${settings.blur}px) brightness(${settings.brightness}) contrast(${settings.contrast}) saturate(${settings.saturation})`;
  media.style.transform = `scale(${settings.zoom})`;
  const pos = positionValue(settings.position, settings.offsetX, settings.offsetY);
  if (settings.type === "video") {
    media.src = settings.source;
    media.autoplay = true;
    media.loop = true;
    media.muted = true;
    media.playsInline = true;
    media.style.objectFit = settings.fit;
    media.style.objectPosition = pos;
    media.style.width = "100%";
    media.style.height = "100%";
  } else {
    media.style.position = "absolute";
    media.style.inset = "0";
    media.style.backgroundImage = `url(${JSON.stringify(settings.source)})`;
    media.style.backgroundSize = settings.fit === "fill" ? "100% 100%" : settings.fit;
    media.style.backgroundPosition = pos;
    media.style.backgroundRepeat = "no-repeat";
  }
  host.append(media);
}

function syncForm() {
  $("enabled").checked = settings.enabled;
  const values = {
    opacity: [`${Math.round(settings.opacity * 100)}%`, 0.72],
    blur: [`${settings.blur}px`, 0],
    tint: [`${Math.round(settings.tint * 100)}%`, 0],
    zoom: [`${Math.round(settings.zoom * 100)}%`, 1],
    offsetX: [`${settings.offsetX}px`, 0],
    offsetY: [`${settings.offsetY}px`, 0],
    brightness: [`${Math.round(settings.brightness * 100)}%`, 1],
    contrast: [`${Math.round(settings.contrast * 100)}%`, 1],
    saturation: [`${Math.round(settings.saturation * 100)}%`, 1]
  };
  for (const [key, [label]] of Object.entries(values)) {
    $(`${key}-value`).textContent = label;
    $(key).value = settings[key];
  }
  $("fit").value = settings.fit;
  $("position").value = settings.position;
  $("source-url").value = settings.source.startsWith("data:") ? "" : settings.source;
  updatePreview();
}

async function saveSettings() {
  try {
    settings = normalizeSettings(settings);
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    announce("已保存");
  } catch (error) {
    console.error("Unable to save wallpaper settings", error);
    announce("保存失败：存储空间不足或不可用", true);
  }
}

function persist(immediate = false) {
  clearTimeout(saveTimer);
  if (immediate) void saveSettings();
  else saveTimer = setTimeout(() => void saveSettings(), 180);
}

function setSource(type, source) {
  if (typeof source !== "string" || !source) return;
  settings.type = type;
  settings.source = source;
  settings.enabled = Boolean(source);
  syncForm();
  persist(true);
}

$("image-button").addEventListener("click", () => $("image-file").click());
$("video-button").addEventListener("click", () => $("video-file").click());

function readFile(input, type) {
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const correctType = type === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/");
    if (!correctType) { announce("文件类型不匹配", true); input.value = ""; return; }
    if (file.size > 8 * 1024 * 1024) { announce("文件请控制在 8 MB 以内", true); input.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setSource(type, reader.result);
      else announce("读取文件失败", true);
    };
    reader.onerror = () => announce("读取文件失败", true);
    reader.readAsDataURL(file);
  });
}
readFile($("image-file"), "image");
readFile($("video-file"), "video");

$("apply-url").addEventListener("click", () => {
  const value = $("source-url").value.trim();
  let url;
  try { url = new URL(value); } catch { announce("请输入有效的 http(s) URL", true); return; }
  if (!["http:", "https:"].includes(url.protocol)) { announce("仅支持 http(s) URL", true); return; }
  const type = /\.(mp4|webm|ogg|ogv|m4v)$/i.test(url.pathname) ? "video" : "image";
  setSource(type, url.href);
});

$("enabled").addEventListener("change", (event) => { settings.enabled = event.target.checked; persist(true); });
for (const key of ["opacity", "blur", "tint", "zoom", "offsetX", "offsetY", "brightness", "contrast", "saturation"]) {
  $(key).addEventListener("input", (event) => {
    const ranges = { opacity: [0, 1, 0.72], blur: [0, 40, 0], tint: [0, 0.8, 0], zoom: [1, 2, 1], offsetX: [-500, 500, 0], offsetY: [-500, 500, 0], brightness: [0.5, 1.5, 1], contrast: [0.5, 1.5, 1], saturation: [0, 2, 1] };
    settings[key] = clamp(event.target.value, ...ranges[key]);
    syncForm();
    persist();
  });
}
$("fit").addEventListener("change", (event) => { settings.fit = event.target.value; syncForm(); persist(true); });
$("position").addEventListener("change", (event) => { settings.position = event.target.value; syncForm(); persist(true); });
$("reset").addEventListener("click", () => { settings = { ...defaults }; syncForm(); persist(true); });

chrome.storage.local.get(STORAGE_KEY)
  .then((result) => {
    settings = normalizeSettings(result[STORAGE_KEY]);
    syncForm();
  })
  .catch((error) => {
    console.error("Unable to load wallpaper settings", error);
    syncForm();
    announce("读取设置失败", true);
  });
