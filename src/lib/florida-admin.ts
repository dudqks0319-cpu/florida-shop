const KEY_BANNER = "florida:admin:banner";
const KEY_IMAGE_OVERRIDES = "florida:admin:image-overrides";

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getBannerImage() {
  return get<string>(KEY_BANNER, "");
}

export function setBannerImage(url: string) {
  set(KEY_BANNER, url);
}

export function getImageOverrides() {
  return get<Record<string, string>>(KEY_IMAGE_OVERRIDES, {});
}

export function setImageOverrides(v: Record<string, string>) {
  set(KEY_IMAGE_OVERRIDES, v);
}
