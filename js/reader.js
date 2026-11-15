// Lesson reader: loads lessons/<id>.json and renders the dialogue,
// the word panel and the "Build it yourself" exercises.

(function () {
  var root = document.getElementById("app");

  // "word|id," -> { t: "word", id: "id", p: "," }   plain words have no id
  function parseLine(s) {
    return s.split(" ").map(function (piece) {
      var i = piece.indexOf("|");
      if (i < 0) return { t: piece, p: "", id: null };
      var rest = piece.slice(i + 1);
      var m = rest.match(/^[a-z0-9_]+/);
      var id = m ? m[0] : "";
      return { t: piece.slice(0, i), p: rest.slice(id.length), id: id };
    });
  }

  function fail(msg) {
    root.replaceChildren(h("div", { class: "wrap" },
      h("a", { href: "./", class: "eyebrow" }, "← All lessons"),
      h("p", null, msg)));
  }

  // Lesson id from ?id=…; without one, open the first lesson in the list.
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  var focusWord = params.get("w");
  var grammarTopics = [];
  var grammarPromise = getJson("grammar/index.json")
    .then(function (g) { grammarTopics = g.topics; })
    .catch(function () { /* grammar pages are optional */ });
  var idPromise = id
    ? Promise.resolve(id)
    : getJson("lessons/index.json").then(function (index) { return index.units[0].lessons[0].id; });

  idPromise
    .then(function (lid) {
      if (!/^[a-z0-9-]+$/.test(lid)) throw new Error("bad id");
      return Promise.all([getJson("lessons/" + lid + ".json"), grammarPromise]);
    })
    .then(function (r) { start(r[0]); })
    .catch(function () { fail("Could not load this lesson."); });

  function start(lesson) {
    document.title = lesson.title + " · Intermediate Polish";
    var words = lesson.words;
    var lines = lesson.lines.map(function (l) {
      return { speaker: l.speaker, gender: l.gender, en: l.en, audio: l.audio, toks: parseLine(l.pl) };
    });

    var state = {
      sel: words[focusWord] ? focusWord : (words[lesson.defaultWord] ? lesson.defaultWord : Object.keys(words)[0]),
      learner: store.get("learner", "m"),
      showEn: store.get("showEn", true),
      built: store.get("built:" + lesson.id, {}),
      checked: store.get("checked:" + lesson.id, {})
    };

    function save() {
      store.set("learner", state.learner);
      store.set("showEn", state.showEn);
      store.set("built:" + lesson.id, state.built);
      store.set("checked:" + lesson.id, state.checked);
    }

    function set(patch) {
      Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
      save();
      render();
    }

    // ---------- header ----------
    function header() {
      function segBtn(label, g) {
        return h("button", {
          class: "seg-btn", "data-key": "seg-" + g,
          "aria-pressed": String(state.learner === g),
          onClick: function () { set({ learner: g }); }
        }, label);
      }
      return h("header", { class: "top" },
        h("div", { class: "titles" },
          h("a", { href: "./", class: "eyebrow" }, "← Intermediate Polish"),
          h("div", { class: "eyebrow" }, lesson.unit + " · Level " + lesson.level + " · " + lesson.cefr + " · Focus: " + lesson.focus),
          h("h1", { lang: "pl" }, lesson.title),
          h("p", { class: "sub" }, lesson.titleEn)),
        h("div", { class: "controls" },
          h("span", { class: "muted small", id: "learner-label" }, "I am a"),
          h("div", { class: "seg", role: "group", "aria-labelledby": "learner-label" },
            segBtn("Man", "m"), segBtn("Woman", "f")),
          h("button", {
            class: "pill", "data-key": "en", "aria-pressed": String(state.showEn),
            onClick: function () { set({ showEn: !state.showEn }); }
          }, "English: " + (state.showEn ? "on" : "off"))));
    }

    // ---------- dialogue ----------
    function token(t) {
      var w = t.id ? words[t.id] : null;
      var gendered = w && w.you && w.you.m !== w.you.f;
      return [h("span", { class: "tok" },
        w ? h("button", {
          class: "word", "data-key": "tok-" + t.id,
          "aria-pressed": String(t.id === state.sel),
          onClick: function () { set({ sel: t.id }); }
        }, t.t) : t.t,
        gendered ? [h("span", { class: "dot", "aria-hidden": "true" }), h("span", { class: "sr-only" }, " (form depends on your gender)")] : null,
        t.p), " "];
    }

    function playButton(l) {
      if (!l.audio) return null;
      return h("button", {
        class: "play", "aria-label": "Play this line",
        onClick: function () { new Audio(l.audio).play(); }
      }, playIcon());
    }

    function playIcon() {
      var ns = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(ns, "svg");
      svg.setAttribute("width", "12"); svg.setAttribute("height", "12");
      svg.setAttribute("viewBox", "0 0 12 12"); svg.setAttribute("aria-hidden", "true");
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", "M3 1.8 L10 6 L3 10.2 Z");
      p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "1.6"); p.setAttribute("stroke-linejoin", "round");
      svg.append(p);
      return svg;
    }

    function dialogue() {
      return h("section", { class: "card dialogue", "aria-label": "Dialogue" },
        h("p", { class: "hint" }, "Tap an underlined word to see how it’s built. A small blue dot means the form would change with your gender."),
        lines.map(function (l) {
          return h("div", { class: "line" },
            h("div", { class: "avatar " + (l.gender === "f" ? "f" : "m"), "aria-hidden": "true" }, l.speaker.charAt(0)),
            h("div", { class: "line-body" },
              h("div", { class: "speaker" }, h("span", null, l.speaker), playButton(l)),
              h("p", { class: "pl", lang: "pl" }, l.toks.map(token)),
              state.showEn ? h("p", { class: "en" }, l.en) : null));
        }));
    }

    // ---------- word panel ----------
    function gramLinks(w) {
      var topics = grammarTopicsFor(w, grammarTopics);
      if (!topics.length) return null;
      return h("div", { class: "g-links" },
        h("h3", null, "Grammar"),
        h("div", { class: "chips" }, topics.map(function (t) {
          return h("a", { class: "chip-link", href: "grammar.html?topic=" + t.id }, t.title + " →");
        })));
    }

    function panel() {
      var w = words[state.sel];
      var pats = (w.patterns || []).map(function (k) {
        return {
          label: lesson.patterns[k] || k,
          others: Object.keys(words).filter(function (oid) {
            return oid !== state.sel && (words[oid].patterns || []).indexOf(k) >= 0;
          })
        };
      }).filter(function (p) { return p.others.length > 0; });

      return h("aside", { class: "card panel", id: "panel", "aria-live": "polite", "aria-label": "Selected word" },
        h("div", null,
          h("div", { class: "eyebrow" }, "Selected word"),
          h("h2", { lang: "pl" }, w.form),
          h("p", { class: "body" }, "from ", h("strong", { lang: "pl", style: "font-family: var(--serif)" }, w.lemma), " · " + w.gloss),
          h("p", { class: "muted small" }, w.tags)),
        h("div", null,
          h("h3", null, "How it’s built"),
          h("div", { class: "parts" }, w.parts.map(function (p) {
            return h("div", { class: "part" },
              h("span", { class: "morph", lang: "pl" }, p[0]),
              h("span", { class: "part-label" }, p[1]));
          }))),
        h("div", null, h("h3", null, "Why this form here"), h("p", { class: "body" }, w.why)),
        w.compare ? h("div", null, h("h3", null, "Compare"), h("p", { class: "body" }, w.compare)) : null,
        w.you ? h("div", { class: "you" },
          h("h3", null, state.learner === "m" ? "Your form (as a man)" : "Your form (as a woman)"),
          h("p", { class: "body" }, w.you[state.learner])) : null,
        w.history ? h("div", null, h("h3", null, "Word history"), h("p", { class: "body" }, w.history)) : null,
        gramLinks(w),
        pats.length ? h("div", { class: "pats" },
          h("h3", null, "Same pattern in this lesson"),
          pats.map(function (p) {
            return h("div", null,
              h("p", { class: "muted small" }, p.label),
              h("div", { class: "chips" }, p.others.map(function (oid) {
                return h("button", {
                  class: "chip", lang: "pl", "data-key": "chip-" + p.label + "-" + oid,
                  onClick: function () { set({ sel: oid }); }
                }, words[oid].form);
              })));
          })) : null);
    }

    // ---------- exercises ----------
    function exercise(e, i) {
      var ans = Array.isArray(e.answer) ? e.answer : e.answer[state.learner];
      var built = state.built[e.id] || [];
      var checked = !!state.checked[e.id];
      var right = built.join("|") === ans.join("|");
      var explain = typeof e.explain === "string" ? e.explain : e.explain[state.learner];

      function update(arr) {
        var b = Object.assign({}, state.built); b[e.id] = arr;
        var c = Object.assign({}, state.checked); c[e.id] = false;
        set({ built: b, checked: c });
      }

      return h("div", { class: "ex" },
        h("div", { class: "ex-head" },
          h("p", { class: "prompt" }, (i + 1) + ". " + e.prompt),
          h("button", {
            class: "chip model", "data-key": "model-" + e.id,
            onClick: function () {
              set({ sel: e.model });
              var p = document.getElementById("panel");
              if (p) p.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, "Model: " + words[e.model].form)),
        h("div", { class: "slot", "aria-live": "polite" },
          built.length
            ? [h("span", { class: "built", lang: "pl" }, built.join("")),
               h("span", { class: "muted small", lang: "pl" }, built.join(" + "))]
            : h("span", { class: "muted small" }, "Your word appears here")),
        h("div", { class: "tiles" }, e.tiles.map(function (t, ti) {
          return h("button", {
            class: "tile", lang: "pl", "data-key": "tile-" + e.id + "-" + ti,
            onClick: function () { update(built.concat([t])); }
          }, t);
        })),
        h("div", { class: "ex-actions" },
          h("button", {
            class: "primary", "data-key": "check-" + e.id,
            onClick: function () {
              var c = Object.assign({}, state.checked); c[e.id] = true;
              set({ checked: c });
            }
          }, "Check"),
          h("button", { class: "pill", "data-key": "undo-" + e.id, onClick: function () { update(built.slice(0, -1)); } }, "Undo"),
          h("button", { class: "pill", "data-key": "clear-" + e.id, onClick: function () { update([]); } }, "Clear")),
        checked && right ? h("div", { class: "fb ok", role: "status" }, h("strong", null, "Right: " + ans.join("") + ". "), explain) : null,
        checked && !right ? h("div", { class: "fb no", role: "status" }, h("strong", null, "Not quite. "), e.hint) : null);
    }

    function exercises() {
      if (!lesson.exercises || !lesson.exercises.length) return null;
      return h("section", { class: "card ex-section", "aria-label": "Exercises" },
        h("div", null,
          h("div", { class: "eyebrow" }, "After the dialogue"),
          h("h2", null, "Build it yourself"),
          h("p", { class: "muted", style: "margin: 6px 0 0" }, "Each word follows the pattern of a form from the dialogue. Tap the pieces in order, then check.")),
        h("div", { class: "ex-grid" }, lesson.exercises.map(exercise)));
    }

    // ---------- render ----------
    function render() {
      // Keep keyboard focus on the same control after re-rendering.
      var active = document.activeElement;
      var key = active && active.getAttribute ? active.getAttribute("data-key") : null;

      root.replaceChildren(h("div", { class: "wrap" },
        header(),
        h("div", { class: "row" }, dialogue(), panel()),
        exercises(),
        siteFooter()));

      if (key) {
        var match = Array.prototype.find.call(root.querySelectorAll("[data-key]"), function (el) {
          return el.getAttribute("data-key") === key;
        });
        if (match) match.focus({ preventScroll: true });
      }
    }

    render();
    if (focusWord && words[focusWord]) {
      var el = Array.prototype.find.call(root.querySelectorAll("[data-key]"), function (e) {
        return e.getAttribute("data-key") === "tok-" + focusWord;
      });
      if (el) el.scrollIntoView({ block: "center" });
    }
  }
})();
