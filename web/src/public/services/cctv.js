// web/src/services/cctv.js

const BASE = 'data/peopleflow';

export function getStreamUrl(cameraId, date) {
  // YOLO video
  return `${BASE}/${cameraId}/${date}/yolo.mp4`;
}

export function getHeatmapUrl(cameraId, date) {
  // Heatmap video
  return `${BASE}/${cameraId}/${date}/heatmap.mp4`;
}

export async function getJson(cameraId, date) {
  const url = `${BASE}/${cameraId}/${date}/meta.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JSON not found: ${res.status}`);
  return await res.json();
}
