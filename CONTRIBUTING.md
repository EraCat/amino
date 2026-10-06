# Translate amino

Translations are UTF-8 JSON. No JavaScript changes or dependency installation are needed to translate a card.

## Edit one card

1. Open `locales/ru/cards/G.json` (the source) and the matching card in your language, such as `locales/en/cards/G.json`.
2. Translate `name`, `info`, `feature`, `history.clue`, and `history.story`. Translate `codonNote` and `sideLabel` when present. Keep all scientific facts, qualifications, dates, and names. Do not shorten the historical explanation into just the clue.
3. Keep `code`, keys, and `sourceRevision`. Set `sourceRevision` to the current `revision` in `content/amino/core.json` after reviewing the source. Use plain text, without HTML. The history clue appears as a quiz question and answer, so it must uniquely identify the same amino acid.
4. An optional `links.wikipedia` is an explicit HTTPS link to the article in your language. Scientific sources and chemical images are shared; do not duplicate them.
5. Run `npm run check:locales` with Node.js 22+, and open a pull request. GitHub also checks the files automatically.

Editor schemas are in `schemas/`. In VS Code they provide completion and highlight malformed cards and dictionaries. Draft files may be incomplete; publication completeness is checked by the validator. JSON has no comments or trailing commas. Repeated keys are rejected. Developers who change Russian dictionary keys should run `npm run schemas:locales` to update editor completion.

## Add a language

Add an entry to `locales/languages.json` with a language tag, its native name, and `"published": false`. Create `locales/<tag>/cards/` and contribute cards individually. Drafts may have missing cards or incomplete fields; supplied fields are checked. Keep the language unpublished until it is complete.

Before publication, supply all 22 cards plus `ui.json`, `questions.json`, and `errors.json`. Copy the structure from `ru`, translate every string, and preserve template parameters such as `{name}`, `{side}`, and `{count}`. The order of parameters may change. Keep stable keys such as `history-forward` and `names-codes`. Plural dictionaries use `Intl.PluralRules` categories and must provide `other`.

After a native speaker has reviewed the translation and `npm run check:locales` passes, set `published` to `true`. The server validates published languages on startup and loads them into memory. Restart the server after changing JSON. There is no repeated disk read when generating questions. Static hosting over HTTP also supports practice and the reference library; exams require the Node server.

## Scientific corrections and source updates

Use a separate pull request for changes to scientific facts or the learning classification. Formula, codon, classification, SVG, and answer identity belong in `content/amino/core.json`, not translation files. Increase the affected card's `revision` when shared content changes too, and review published translations before updating their `sourceRevision`.

Russian is currently the editorial source. When changing its card text, increase that card's `revision` in `core.json`, update the Russian `sourceRevision`, and review the other published translations before increasing their `sourceRevision`. CI checks source revisions against the pull request base. This prevents an old translation from silently appearing current.

Preserve these distinctions: free amino acid versus residue, cysteine versus cystine, a side-chain category versus a dietary category, and ordinary stop codons versus special Sec/Pyl decoding. Translate essentiality for a healthy adult consistently. Do not turn a qualified statement into an absolute one.

## Behavior checks

`npm run smoke:locales` uses temporary results, starts an isolated local server, and checks translated JSON delivery, both exam languages, answer grading, repeat requests, and resuming a legacy Russian attempt. It does not touch real participant results.

Use `npm start` and check the UI in both languages, including mobile layout, the reference cards, help, a practice round, and an exam. The language selector is locked during an unfinished practice round or active exam. Progress and rankings are shared across languages; stored exam questions keep their original language and answer order.
