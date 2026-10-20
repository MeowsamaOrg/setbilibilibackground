# Bilibili Wallpaper Background

一个由 **Sinmeowsama** 制作的 Microsoft Edge 扩展，用自定义图片或动态视频替换哔哩哔哩网页背景。

## 功能 / Features

- 支持 Bilibili 全站页面背景替换
- 支持图片、GIF 图片、MP4/WebM/Ogg 视频动态壁纸
- 支持本地文件上传和远程图片/视频 URL
- 浏览器内 GUI：启用开关、透明度、模糊、暗色遮罩、缩放、亮度、对比度、饱和度、X/Y 偏移、填充方式和位置
- 设置保存在浏览器本地，不上传到第三方服务器

## 安装 / Installation

1. 下载或克隆本仓库。
2. 在 Edge 地址栏打开 `edge://extensions`。
3. 打开右上角的“开发人员模式”。
4. 点击“加载解压缩的扩展”，选择本项目目录。
5. 打开任意 Bilibili 页面，点击工具栏中的扩展图标进行设置。

1. Download or clone this repository.
2. Open `edge://extensions` in Microsoft Edge.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this project folder.
5. Open any Bilibili page and use the extension icon to configure the wallpaper.

## 使用 / Usage

上传图片或视频后，打开右上角开关即可启用。也可以粘贴 `http(s)` 图片或视频地址并点击“应用”。视频文件会自动循环播放、静音播放。X/Y 偏移范围为 -500 至 +500 像素；缩放、亮度、对比度和饱和度可独立调整。

Upload an image or video, then turn on the switch. You can also paste an `http(s)` image or video URL and click **Apply**. Videos loop automatically and play muted. X/Y offsets range from -500 to +500 pixels; zoom, brightness, contrast, and saturation can be adjusted independently.

本地文件大小限制为 8 MB，这是为了适配浏览器扩展本地存储配额。/ Local files are limited to 8 MB to fit browser extension storage quotas.

## 开发 / Development

本项目是原生 Manifest V3 扩展，不需要构建工具。修改文件后，在 `edge://extensions` 页面点击扩展卡片上的刷新按钮即可加载最新版本。

This is a native Manifest V3 extension with no build step. After editing files, click the extension card's reload button on `edge://extensions`.

## 作者与许可 / Author & License

作者 / Author: **Sinmeowsama**  
许可证 / License: MIT
