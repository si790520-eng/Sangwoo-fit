/* 색 변환, 대표색, 사진 압축 */
(function (root) {
  function hexToRgb(hex) {
    const h = String(hex || "").replace("#", "");
    if (h.length !== 6) return [136, 136, 136];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return "#" + c(r) + c(g) + c(b);
  }
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + amt, g + amt, b + amt);
  }
  function luma(hex) {
    const [r, g, b] = hexToRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  function safeHex(h) {
    return /^#[0-9a-fA-F]{6}$/.test(h || "") ? h.toUpperCase() : "#888888";
  }
  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  function nearestPreset(hex) {
    const presets = (root.ClosetData && root.ClosetData.PRESETS) || [];
    let best = null;
    let bestD = 1e9;
    const rgb = hexToRgb(hex);
    for (const [name, c] of presets) {
      const d = dist(rgb, hexToRgb(c));
      if (d < bestD) {
        bestD = d;
        best = name;
      }
    }
    return bestD < 86 ? best : null;
  }

  function family(hex) {
    const [r, g, b] = hexToRgb(hex);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 22) {
      if (l < 48) return "black";
      if (l > 214) return "white";
      if (l > 168) return "lightgray";
      return "gray";
    }
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    if (h < 18 || h >= 345) return l < 110 ? "brown" : "camel";
    if (h < 48) return l < 95 ? "brown" : "camel";
    if (h < 75) return l < 120 ? "khaki" : "camel";
    if (h < 170) return "khaki";
    if (h < 205) return l > 150 ? "sky" : "blue";
    if (h < 265) return l < 95 ? "navy" : "blue";
    return l < 90 ? "navy" : "blue";
  }

  const FAM_KO = {
    black: "블랙", white: "화이트", gray: "그레이", lightgray: "라이트 그레이",
    beige: "베이지", camel: "카멜", brown: "브라운", navy: "네이비",
    blue: "블루", sky: "스카이", khaki: "카키", olive: "카키"
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
      img.src = src;
    });
  }

  async function fileToImage(file) {
    const url = URL.createObjectURL(file);
    try {
      return await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function compressImage(file, maxSize) {
    const img = await fileToImage(file);
    const max = maxSize || 960;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#f4f1ec";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.72));
    return { blob, canvas, width: w, height: h };
  }

  function dominantFromCanvas(canvas) {
    const size = 48;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const at = (x, y) => [data[(y * size + x) * 4], data[(y * size + x) * 4 + 1], data[(y * size + x) * 4 + 2]];
    const corners = [at(1, 1), at(size - 2, 1), at(1, size - 2), at(size - 2, size - 2)];
    const avgC = corners.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map((n) => n / 4);
    const cornerClose = corners.every((p) => dist(p, avgC) < 36);

    function mode(ignoreBg) {
      const buckets = new Map();
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const a = data[i + 3];
          if (a < 140) continue;
          const rgb = [data[i], data[i + 1], data[i + 2]];
          if (ignoreBg && cornerClose && dist(rgb, avgC) < 38) continue;
          if (rgb[0] > 248 && rgb[1] > 248 && rgb[2] > 248) continue;
          const q = rgb.map((v) => Math.round(v / 16) * 16);
          const key = q.join(",");
          const dx = x - size / 2;
          const dy = y - size / 2;
          const wgt = 0.45 + (1 - Math.min(1, Math.hypot(dx, dy) / (size * 0.62)));
          buckets.set(key, (buckets.get(key) || 0) + wgt);
        }
      }
      let best = null;
      let bestW = 0;
      for (const [k, w] of buckets) {
        if (w > bestW) {
          bestW = w;
          best = k;
        }
      }
      return best;
    }

    const picked = mode(true) || mode(false);
    if (!picked) return "#888888";
    const [r, g, b] = picked.split(",").map(Number);
    return rgbToHex(r, g, b);
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(url) {
    const [head, body] = String(url).split(",");
    const mime = (head.match(/data:(.*?);/) || [])[1] || "image/jpeg";
    const bin = atob(body || "");
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  root.ClosetColor = {
    hexToRgb, rgbToHex, shade, luma, safeHex, dist, nearestPreset, family, FAM_KO,
    compressImage, dominantFromCanvas, blobToDataURL, dataURLToBlob
  };
})(typeof window !== "undefined" ? window : globalThis);
