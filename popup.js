const STORAGE_KEY = "bwpSettings";
const defaults = { enabled: false, type: "image", source: "", opacity: 0.72, blur: 0, fit: "cover", position: "center", tint: 0 };
let settings = { ...defaults };
let saveTimer;

const $ = (id) => document.getElementById(id);

function announce(text, error = false) {
  $("message").textContent = text;
  $("message").style.color = error ? "#ff8792" : "#69d5a2";
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => { $("message").textContent = ""; }, 2600);
}

function updatePreview() {
  const host = $("preview-media");
  host.replaceChildren();
  $("preview-empty").hidden = !settings.source;
  $("source-status").textContent = settings.source ? `${settings.type === "video" ? "视频" : "图片"}已设置` : "未设置";
  if (!settings.source) return;
  if (settings.type === "video") {
    const video = document.createElement("video");
    video.src = settings.source; video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true;
    host.append(video);
  } else {
    host.style.backgroundImage = `url(${JSON.stringify(settings.source)})`;
  }
}

function syncForm() {
  $("enabled").checked = settings.enabled;
  $("opacity").value = settings.opacity; $("opacity-value").textContent = `${Math.round(settings.opacity * 100)}%`;
  $("blur").value = settings.blur; $("blur-value").textContent = `${settings.blur}px`;
  $("tint").value = settings.tint; $("tint-value").textContent = `${Math.round(settings.tint * 100)}%`;
  $("fit").value = settings.fit; $("position").value = settings.position;
  $("source-url").value = settings.source.startsWith("data:") ? "" : settings.source;
  updatePreview();
}

function persist(immediate = false) {
  clearTimeout(saveTimer);
  const save = () => chrome.storage.local.set({ [STORAGE_KEY]: settings }).then(() => announce("已保存"));
  if (immediate) save(); else saveTimer = setTimeout(save, 180);
}

function setSource(type, source) {
  settings.type = type; settings.source = source; settings.enabled = Boolean(source);
  syncForm(); persist(true);
}

$("image-button").addEventListener("click", () => $("image-file").click());
$("video-button").addEventListener("click", () => $("video-file").click());

function readFile(input, type) {
  input.addEventListener("change", () => {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) { announce("文件请控制在 8 MB 以内", true); input.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => setSource(type, reader.result);
    reader.onerror = () => announce("读取文件失败", true);
    reader.readAsDataURL(file);
  });
}
readFile($("image-file"), "image"); readFile($("video-file"), "video");

$("apply-url").addEventListener("click", () => {
  const source = $("source-url").value.trim();
  if (!/^https?:\/\//i.test(source)) { announce("请输入有效的 http(s) URL", true); return; }
  const type = /\.(mp4|webm|ogg)(\?|#|$)/i.test(source) ? "video" : "image";
  setSource(type, source);
});

$("enabled").addEventListener("change", (event) => { settings.enabled = event.target.checked; persist(true); });
$("opacity").addEventListener("input", (event) => { settings.opacity = Number(event.target.value); $("opacity-value").textContent = `${Math.round(settings.opacity * 100)}%`; persist(); });
$("blur").addEventListener("input", (event) => { settings.blur = Number(event.target.value); $("blur-value").textContent = `${settings.blur}px`; persist(); });
$("tint").addEventListener("input", (event) => { settings.tint = Number(event.target.value); $("tint-value").textContent = `${Math.round(settings.tint * 100)}%`; persist(); });
$("fit").addEventListener("change", (event) => { settings.fit = event.target.value; persist(true); });
$("position").addEventListener("change", (event) => { settings.position = event.target.value; persist(true); });
$("reset").addEventListener("click", () => { settings = { ...defaults }; syncForm(); persist(true); announce("已清除"); });

chrome.storage.local.get(STORAGE_KEY).then((result) => { settings = { ...defaults, ...(result[STORAGE_KEY] || {}) }; syncForm(); });
