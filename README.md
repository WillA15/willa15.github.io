# Fast Lap

An unofficial F1 fan site: the next race, its session times in your own time zone,
and the headlines to know before lights out.

Live at **https://willa15.github.io**

## The files

| File | What it does |
| --- | --- |
| `index.html` | The page's structure: header, next-race panel, headlines, coming up, footer. |
| `style.css` | The look: colours, fonts, layout. The colours are variables at the top. |
| `script.js` | Reads `data.json`, picks the next race by date, and fills in the page. |
| `data.json` | **All the content.** This is the file you edit to update the site. |

## Updating the site

Everything you'd normally change is in `data.json`.

### Add a headline

Add a new entry to the `"headlines"` list (anywhere in the list, but the top is easiest):

```json
{
  "date": "2026-09-27",
  "title": "Your short headline, in your own words",
  "whyItMatters": "One or two sentences on why a fan should know this before the next race.",
  "source": "Formula1.com",
  "url": "https://link-to-the-original-article"
}
```

- The page shows the **5 newest** headlines by `date`, so older ones drop off on their own.
- Write `date` as `YYYY-MM-DD`.
- Stick to well-known outlets (Formula1.com, BBC Sport, The Race, Autosport, Sky Sports, ESPN).
- Link to the article rather than copying it.

Then change `"lastUpdated"` at the top of the file to today's date.

### Add "What to watch for" notes

Each race has a `"watchFor"` list. Fill it in during race week for the next race:

```json
"watchFor": [
  "First note.",
  "Second note."
]
```

If the list is empty (`[]`), that part of the panel is hidden.

### Races

You shouldn't need to touch these. The page works out which race is next by comparing
dates with today, so it moves on by itself after each race weekend. For reference:

- `sessions` times are in **UTC** (that's what the `Z` at the end means). The page
  converts them to each visitor's own time zone.
- Each race needs a session called `"Race"`. The race stays featured until 3 hours
  after it starts.
- `"sprint": true` shows the Sprint weekend badge.

### Watch out for JSON commas

Every item in a list needs a comma after it **except the last one**. If the page shows
"Sorry, the race data didn't load", a missing or extra comma in `data.json` is the usual cause.
Pasting the file into a JSON checker such as jsonlint.com will point to the exact line.

## Previewing on your computer

The page loads `data.json`, and browsers block that when you just double-click
`index.html`. Run a tiny local server from this folder instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

To see what the page will look like on another day, add `?date=` to the address:

- http://localhost:8000/?date=2026-09-28 shows Sepang as the next race
- http://localhost:8000/?date=2026-10-05 shows Singapore, a Sprint weekend
- http://localhost:8000/?date=2026-12-07 shows the end-of-season message

## Publishing

Commit your changes and push them to `main`. GitHub Pages updates the live site
within a minute or two.

---

Fast Lap is an unofficial fan site and is not associated in any way with the Formula 1
companies or the FIA.
