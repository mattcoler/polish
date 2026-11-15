// Home page: two collapsible sections, Dialogues (with a collapsible block per unit) and Grammar.

(function () {
  // Remember which sections were open; open the one named in the URL hash (e.g. #grammar).
  function remember(details, key, fallback) {
    var saved = store.get("open:" + key, null);
    details.open = location.hash === "#" + key ? true : (saved === null ? fallback : saved);
    details.addEventListener("toggle", function () { store.set("open:" + key, details.open); });
    return details;
  }
  remember(document.getElementById("dialogues"), "dialogues", true);
  remember(document.getElementById("grammar"), "grammar", false);

  function levels(lessons) {
    var lv = lessons.map(function (l) { return l.level; }).sort();
    return lv[0] === lv[lv.length - 1] ? "Level " + lv[0] : "Levels " + lv[0] + "–" + lv[lv.length - 1];
  }

  var box = document.getElementById("lessons");
  getJson("lessons/index.json")
    .then(function (index) {
      var count = index.units.reduce(function (n, u) { return n + u.lessons.length; }, 0);
      document.getElementById("dialogues-meta").textContent = count + " lessons in " + index.units.length + " units";
      box.replaceChildren.apply(box, index.units.map(function (u, i) {
        var key = "unit-" + u.title.toLowerCase().replace(/[^a-z]+/g, "-");
        var d = h("details", { class: "unit c" + (i % 3) },
          h("summary", null,
            h("span", { class: "unit-title" }, u.title),
            h("span", { class: "unit-meta" },
              h("span", { lang: "pl" }, u.titlePl),
              " · " + u.lessons.length + (u.lessons.length === 1 ? " lesson" : " lessons") + " · " + levels(u.lessons))),
          h("ul", { class: "lesson-list" }, u.lessons.map(function (l) {
            return h("li", null,
              h("a", { class: "lesson-card", href: "lesson.html?id=" + encodeURIComponent(l.id) },
                h("span", { class: "eyebrow" }, "Level " + l.level + " · " + l.cefr),
                h("h3", { lang: "pl" }, l.title),
                h("span", { class: "muted" }, l.titleEn),
                h("span", { class: "muted small" }, "Focus: " + l.focus)));
          })));
        return remember(d, key, i === 0);
      }));
    })
    .catch(function () { box.replaceChildren(h("p", null, "Could not load the lesson list.")); });

  var gbox = document.getElementById("grammar-list");
  getJson("grammar/index.json")
    .then(function (g) {
      var ready = g.topics.filter(function (t) { return t.status === "ready"; });
      var planned = g.topics.filter(function (t) { return t.status !== "ready"; });
      document.getElementById("grammar-meta").textContent = ready.length + (ready.length === 1 ? " page" : " pages") + (planned.length ? " · " + planned.length + " in preparation" : "");
      gbox.replaceChildren(
        h("ul", { class: "lesson-list" }, ready.map(function (t) {
          return h("li", null,
            h("a", { class: "lesson-card", href: "grammar.html?topic=" + t.id },
              h("span", { class: "eyebrow" }, "Grammar"),
              h("h3", null, t.title),
              h("span", { class: "muted", lang: "pl" }, t.titlePl),
              t.summary ? h("span", { class: "muted small" }, t.summary) : null));
        })),
        planned.length ? h("div", { class: "planned" },
          h("h3", null, "In preparation"),
          h("ul", null, planned.map(function (t) {
            return h("li", null, t.title, " ", h("span", { class: "muted", lang: "pl" }, "· " + t.titlePl));
          }))) : null);
    })
    .catch(function () { gbox.replaceChildren(h("p", { class: "muted" }, "Could not load the grammar pages.")); });

  document.getElementById("footer").replaceWith(siteFooter());
})();
