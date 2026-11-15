// Small helpers shared by the home page and the lesson reader.

// Build a DOM element: h("button", { class: "x", onClick: fn }, "label", child, ...)
function h(tag, attrs) {
  var el = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k.slice(0, 2) === "on" && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "class") {
        el.className = v;
      } else {
        el.setAttribute(k, v === true ? "" : String(v));
      }
    });
  }
  for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
  return el;
}

function append(el, kid) {
  if (kid === null || kid === undefined || kid === false) return;
  if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
  el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
}

// Browser storage that never throws (private mode, blocked storage, etc.).
var store = {
  get: function (key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set: function (key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
};

// On GitHub Pages, work out the repository's address so the footer can link to it.
function repoUrl() {
  var host = location.hostname;
  if (!/\.github\.io$/.test(host)) return null;
  var user = host.replace(/\.github\.io$/, "");
  var repo = location.pathname.split("/").filter(Boolean)[0];
  if (!repo || /\.html$/.test(repo)) return "https://github.com/" + user + "/" + user + ".github.io";
  return "https://github.com/" + user + "/" + repo;
}

function siteFooter() {
  var repo = repoUrl();
  return h("footer", null,
    "Lesson content CC BY-SA 4.0 · Code MIT",
    repo ? [" · ", h("a", { href: repo + "/issues" }, "Suggest a correction")] : null
  );
}
