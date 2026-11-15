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
  document.getElementById("footer").replaceWith(siteFooter());
})();
