// Home page: lists the units and lessons in lessons/index.json.

(function () {
  var box = document.getElementById("lessons");
  fetch("lessons/index.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (index) {
      box.replaceChildren.apply(box, index.units.map(function (u) {
        return h("section", { class: "unit" },
          h("h2", { class: "unit-title" }, u.title),
          h("p", { class: "muted small unit-pl", lang: "pl" }, u.titlePl),
          h("ul", { class: "lesson-list" }, u.lessons.map(function (l) {
            return h("li", null,
              h("a", { class: "lesson-card", href: "lesson.html?id=" + encodeURIComponent(l.id) },
                h("span", { class: "eyebrow" }, "Level " + l.level + " · " + l.cefr),
                h("h3", { lang: "pl" }, l.title),
                h("span", { class: "muted" }, l.titleEn),
                h("span", { class: "muted small" }, "Focus: " + l.focus)));
          })));
      }));
    })
    .catch(function () {
      box.replaceChildren(h("p", null, "Could not load the lesson list."));
    });
  var gbox = document.getElementById("grammar-list");
  getJson("grammar/index.json")
    .then(function (g) {
      var ready = g.topics.filter(function (t) { return t.status === "ready"; });
      var planned = g.topics.filter(function (t) { return t.status !== "ready"; });
      gbox.replaceChildren(
        h("ul", { class: "lesson-list" }, ready.map(function (t) {
          return h("li", null,
            h("a", { class: "lesson-card", href: "grammar.html?topic=" + t.id },
              h("span", { class: "eyebrow" }, "Grammar"),
              h("h3", null, t.title),
              h("span", { class: "muted", lang: "pl" }, t.titlePl),
              t.summary ? h("span", { class: "muted small" }, t.summary) : null));
        })),
        planned.length ? h("p", { class: "muted small", style: "margin-top: 14px" },
          "In preparation: " + planned.map(function (t) { return t.title.replace(/^The /, ""); }).join(", ") + ".") : null);
    })
    .catch(function () { gbox.replaceChildren(h("p", { class: "muted" }, "Could not load the grammar pages.")); });
  document.getElementById("footer").replaceWith(siteFooter());
})();
