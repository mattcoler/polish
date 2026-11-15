# Intermediate Polish

Dialogue-based lessons for intermediate learners of Polish. Lessons are grouped into thematic units (greetings, making plans, …), each with levels of increasing difficulty. Learners read a short, realistic conversation. They can tap any underlined word to see how it's built and why it takes that form in that sentence. Each lesson ends with exercises where learners assemble new words from the same building blocks.

The site is plain HTML, CSS and JavaScript. It has no build step and no server, so GitHub Pages can host it as it is.

## How the site is organised

```
index.html                 home page: list of lessons
lesson.html                lesson reader (lesson.html?id=<lesson id>)
css/style.css              all styling
js/common.js               shared helpers
js/home.js                 builds the lesson list
js/reader.js               builds a lesson page
lessons/index.json         units and lessons shown on the home page
lessons/<lesson id>.json   one file per lesson
```

## Adding or editing a lesson

You don't need to touch any code to add or edit lessons. Everything is in the `lessons/` folder.

1. Copy an existing lesson file, e.g. `lessons/plans-3-plany-na-sobote.json`, and give it a new name. Use only lower-case letters, digits and hyphens, e.g. `greetings-3-nowa-praca.json`.
2. Change `"id"` inside the file to match the new file name (without `.json`).
3. Add an entry for it under the right unit in `lessons/index.json`. Give the lesson file the same `unit`, `level` and `cefr` values.

### Writing dialogue lines

Each line has a `speaker`, a `gender` (`"m"` or `"f"`), the Polish text `pl`, and an English translation `en`. You can also give it an `audio` path, e.g. `"audio/01-line1.mp3"`, and a play button will appear.

To make a word clickable, add `|` and an annotation id right after it, before any punctuation:

```
"pl": "Jeszcze nie. Poszłabym|poszlabym, ale nie mam siły|sily."
```

Each id must have an entry under `"words"`. Annotation ids can use lower-case letters, digits and `_`.

### Word annotations

```json
"poszlabym": {
  "form": "Poszłabym",
  "lemma": "pójść",
  "gloss": "to go (and get there)",
  "tags": "verb · perfective · conditional · 1st person singular · feminine",
  "parts": [["po", "perfective prefix"], ["sz", "past stem"], ["ł", "past"], ["a", "feminine"], ["by", "conditional"], ["m", "I"]],
  "why": "Why this form appears here.",
  "compare": "Optional: a contrasting form.",
  "history": "Optional: etymology.",
  "you": { "m": "Optional: the form a male learner would use.", "f": "…and a female learner." },
  "patterns": ["conditional", "speaker"]
}
```

A word with a `you` entry gets an orange dot in the dialogue if the two forms differ. Words that share a pattern key are linked to each other in the side panel. The pattern keys and their display names are listed under `"patterns"` at the top of the lesson file.

### Exercises

```json
{
  "id": "e1",
  "model": "poszlabym",
  "prompt": "Say “I would buy” about yourself (kupić).",
  "answer": { "m": ["kupi", "ł", "by", "m"], "f": ["kupi", "ł", "a", "by", "m"] },
  "tiles": ["kupi", "ł", "a", "li", "by", "m", "ś"],
  "explain": "Shown when the answer is right (can also be split into m/f).",
  "hint": "Shown when the answer is wrong."
}
```

`answer` can be a single list, or one list per learner gender as shown above. `model` is the id of the word in the dialogue that the exercise is based on.

## Trying it on your own computer

Browsers block the lesson files from loading when you open `index.html` directly from disk. From this folder, run:

```
python3 -m http.server
```

Then open http://localhost:8000.

## Contributing

Corrections and new dialogues are welcome. Open an issue, or edit a lesson file in GitHub and propose the change as a pull request.

## License

Code: MIT (see `LICENSE`). Lesson content in `lessons/`: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
