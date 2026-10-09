# Translate amino

Translations are UTF-8 JSON. No JavaScript changes or dependency installation are needed to translate a card.

## Edit one card

1. Open `locales/ru/cards/G.json` (the source) and the matching card in your language, such as `locales/en/cards/G.json`.
2. Translate `name`, `info`, `feature`, `history.clue`, and `history.story`. Translate `sideLabel` when present. Keep all scientific facts, qualifications, dates, and names. Do not shorten the historical explanation into just the clue.
3. Keep `code`, keys, and `sourceRevision`. Set `sourceRevision` to the current `revision` in `content/amino/core.json` after reviewing the source. Use plain text, without HTML. The history clue appears as a quiz question and answer, so it must uniquely identify the same amino acid.
4. An optional `links.wikipedia` is an explicit HTTPS link to the article in your language. Scientific sources and chemical images are shared; do not duplicate them.
5. Run `npm run check:locales` with Node.js 22+, and open a pull request. GitHub also checks the files automatically.

Editor schemas are in `schemas/`. In VS Code they provide completion and highlight malformed cards and dictionaries. Draft files may be incomplete; publication completeness is checked by the validator. JSON has no comments or trailing commas. Repeated keys are rejected. Developers who change Russian dictionary keys should run `npm run schemas:locales` to update editor completion.

## Add a language

Add an entry to `locales/languages.json` with a language tag, its native name, and `"published": false`. Create `locales/<tag>/cards/` and contribute cards individually. Drafts may have missing cards or incomplete fields; supplied fields are checked. Keep the language unpublished until it is complete.

Before publication, supply all 22 cards plus `ui.json`, `questions.json`, and `errors.json`. Copy the structure from `ru`, translate every string, and preserve template parameters such as `{name}`, `{side}`, and `{count}`. The order of parameters may change. Keep stable keys such as `history-forward` and `names-codes`. Plural dictionaries use `Intl.PluralRules` categories and must provide `other`.

After a native speaker has reviewed the translation and `npm run check:locales` passes, set `published` to `true`. The server validates published languages on startup and loads them into memory. Restart the server after changing JSON. There is no repeated disk read when generating questions. Static hosting over HTTP also supports practice and the reference library; exams require the Node server.

## Scientific corrections and source updates

Use a separate pull request for changes to scientific facts or the learning classification. Classification, SVG, and answer identity belong in `content/amino/core.json`, not translation files. Increase the affected card's `revision` when shared content changes too, and review published translations before updating their `sourceRevision`.

Russian is currently the editorial source. When changing its card text, increase that card's `revision` in `core.json`, update the Russian `sourceRevision`, and review the other published translations before increasing their `sourceRevision`. CI checks source revisions against the pull request base. This prevents an old translation from silently appearing current.

Preserve these distinctions: free amino acid versus residue, cysteine versus cystine, and a side-chain category versus a dietary category. Translate essentiality for a healthy adult consistently. Do not turn a qualified statement into an absolute one.

## Behavior checks

`npm run smoke:locales` uses temporary results, starts an isolated local server, and checks translated JSON delivery, both exam languages, answer grading, repeat requests, resuming a legacy Russian attempt, and excluding removed topics from starts, history, and rankings. It does not touch real participant results.

`npm run smoke:hard` checks hard mode in both languages: typed answers, multiple valid names, input validation, choice questions, repeat requests, saved difficulty, the three-error rule, and separate rankings. It also uses an isolated server and temporary results.

Use `npm start` and check the UI in both languages, including mobile layout, the reference cards, help, a practice round, and an exam. The language selector is locked during an unfinished practice round or active exam. Progress and rankings are shared across languages; stored exam questions keep their original language and answer order.

Hard mode replaces short textual choices with an input. Names accept the localized name, the shared English name, and the legacy Russian name; codes must use their own format. Case, repeated whitespace, and Russian е/ё are ignored. Where a prompt has several valid answers, any matching amino acid is accepted. Image choices and descriptive answers remain multiple choice. Existing attempts without a difficulty field belong to normal mode.

## Question and image variants

Question wording, structural traits and alternate history clues live in `locales/<tag>/questions.json`. The alternate clues draw only on the sourced stories in the cards. Update both published languages and regenerate locale schemas when adding keys.

`content/structures.json` maps each amino acid to five prebuilt SVGs in `structures/variants/`. Python and RDKit are needed only to regenerate them: install `rdkit==2026.9.1`, then run `python scripts/generate-structures.py`. The script uses the existing isomeric SMILES, verifies 3D stereochemistry, and writes the manifest after all molecules succeed. Check all new views visually, including the heteroatom labels at phone size; camera scoring is a heuristic, not proof of readability. 3D views represent calculated conformers, not measured structures. No images are generated on the server or the user's device.

Practice can restrict images to 2D or 3D; exams use the same mixed pool for everyone. Matching questions use different drawings of one molecule; all answer images in a question use the same style. The chosen URLs and feedback are saved in exam questions, so reloads keep the same question. Preserve existing assets for saved attempts. Old v3–v9 attempts remain playable and retain their scores.

Mistake review stores a confusable amino acid when the wrong answer identifies one; that candidate is prioritised on the next review. Feedback compares the actual side chains when the error concerns structure or properties. `npm run smoke:hard` covers the new formats through the HTTP grading path and checks that all variant SVGs are served without active or external content.

Reverse classification questions require every listed property, not an exact match of all category tags. Additional properties do not disqualify an answer. Typed questions accept every matching amino acid; multiple-choice distractors exclude all other matches. Unanswered typed classification questions in saved exams are upgraded to this rule; recorded answers and scores are left intact.

`npm run smoke:classification` checks single-answer choices over all 20 standard amino acids in both languages and difficulty modes, including intersecting categories, structural properties, dietary categories and legacy saved choices. New distractors exclude every logically valid option, including shorter true classification descriptions. Old saved alternatives are accepted without changing their order.
