export const API_URL = import.meta.env.VITE_API_URL || "https://url-shortener-n5z1.onrender.com";

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    if (res.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    let message = "Something went wrong.";
    if (typeof data?.detail === "string") message = data.detail;
    else if (Array.isArray(data?.detail)) message = data.detail.map((d) => d.msg).join(", ");
    throw new Error(message);
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  signup: (username, password) => request("/auth/signup", json("POST", { username, password })),
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    }),
  createLink: (url) => request("/shorten", json("POST", { url })),
  getLinks: () => request("/links"),
  getStats: (code, days = 7) => request(`/stats/${code}?days=${days}`),
  deleteLink: (code) => request(`/links/${code}`, { method: "DELETE" }),
};