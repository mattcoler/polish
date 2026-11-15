// Grammar page: renders grammar/<topic>.json and collects examples from all lessons.

(function () {
  var root = document.getElementById("app");

  function fail(msg) {
    root.replaceChildren(h("div", { class: "wrap" },
      h("a", { href: "./", class: "eyebrow" }, "← Intermediate Polish"),
      h("p", null, msg)));
  }

  var wanted = new URLSearchParams(location.search).get("topic");

  Promise.all([getJson("grammar/index.json"), getJson("lessons/index.json")])
    .then(function (r) {
      var topics = r[0].topics, units = r[1].units;
      var ready = topics.filter(function (t) { return t.status === "ready"; });
      var topic = ready.filter(function (t) { return t.id === wanted; })[0] || ready[0];
      if (!topic) throw new Error("no topic");
      var entries = [];
      units.forEach(function (u) { u.lessons.forEach(function (l) { entries.push(l); }); });
      return Promise.all([
        getJson("grammar/" + topic.id + ".json"),
        Promise.all(entries.map(function (l) { return getJson("lessons/" + l.id + ".json"); }))
      ]).then(function (r2) { render(topic, topics, r2[0], r2[1]); });
    })
    .catch(function () { fail("Could not load this grammar page."); });

  function block(b) {
    if (b.type === "h") return h("h2", { class: "g-h" }, b.text);
    if (b.type === "p") return h("p", { class: "g-p" }, rich(b.text));
    if (b.type === "breakdown") {
      return h("div", { class: "parts g-breakdown" }, b.parts.map(function (p) {
        return h("div", { class: "part" },
          h("span", { class: "morph", lang: "pl" }, p[0]),
          h("span", { class: "part-label" }, p[1]));
      }));
    }
    if (b.type === "table") {
      return h("div", { class: "table-wrap" },
        h("table", { class: "g-table" },
          b.caption ? h("caption", null, rich(b.caption)) : null,
          h("thead", null, h("tr", null, b.head.map(function (c) { return h("th", { scope: "col" }, rich(c)); }))),
          h("tbody", null, b.rows.map(function (row) {
            return h("tr", null, row.map(function (c, i) {
              return i === 0 ? h("th", { scope: "row" }, rich(c)) : h("td", null, rich(c));
            }));
          }))));
    }
    if (b.type === "examples") {
      return h("ul", { class: "g-examples" }, b.items.map(function (it) {
        return h("li", null, h("span", { class: "g-ex-pl", lang: "pl" }, it.pl), h("span", { class: "g-ex-en" }, it.en));
      }));
    }
    return null;
  }

  function attested(topic, lessons) {
    var groups = lessons.map(function (lesson) {
      var hits = Object.keys(lesson.words).filter(function (id) {
        return grammarTopicsFor(lesson.words[id], [topic]).length > 0;
      });
      return { lesson: lesson, hits: hits };
    }).filter(function (g) { return g.hits.length; });
    var total = groups.reduce(function (n, g) { return n + g.hits.length; }, 0);

    return h("section", { class: "card g-attested", "aria-label": "Examples in the lessons" },
      h("div", { class: "eyebrow" }, "In the lessons"),
      h("h2", null, total + " examples in " + groups.length + " lessons"),
      h("p", { class: "muted small", style: "margin: 4px 0 0" }, "Tap a word to open it in its dialogue."),
      groups.map(function (g) {
        return h("div", { class: "g-group" },
          h("h3", null, h("a", { href: "lesson.html?id=" + encodeURIComponent(g.lesson.id), lang: "pl" }, g.lesson.title)),
          h("ul", { class: "g-hits" }, g.hits.map(function (id) {
            var w = g.lesson.words[id];
            return h("li", null,
              h("a", { class: "g-hit", href: "lesson.html?id=" + encodeURIComponent(g.lesson.id) + "&w=" + encodeURIComponent(id) },
                h("span", { class: "g-hit-form", lang: "pl" }, w.form),
                h("span", { class: "g-hit-tags" }, w.lemma + " · " + w.tags)));
          })));
      }));
  }

  function render(topic, topics, page, lessons) {
    document.title = page.title + " · Intermediate Polish";
    var others = topics.filter(function (t) { return t.status === "ready" && t.id !== topic.id; });
    root.replaceChildren(h("div", { class: "wrap" },
      h("header", { class: "titles" },
        h("a", { href: "./#grammar", class: "eyebrow" }, "← Intermediate Polish · Grammar"),
        h("h1", null, page.title),
        h("p", { class: "sub", lang: "pl" }, page.titlePl)),
      h("article", { class: "card g-article" }, page.blocks.map(block)),
      attested(topic, lessons),
      others.length ? h("nav", { class: "g-others", "aria-label": "Other grammar pages" },
        h("div", { class: "eyebrow" }, "More grammar"),
        h("div", { class: "chips" }, others.map(function (t) {
          return h("a", { class: "chip-link", href: "grammar.html?topic=" + t.id }, t.title);
        }))) : null,
      siteFooter()));
  }
})();
