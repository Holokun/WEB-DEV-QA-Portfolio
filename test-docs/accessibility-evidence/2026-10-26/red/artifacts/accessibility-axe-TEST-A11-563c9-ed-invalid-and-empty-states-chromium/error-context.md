# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility\axe.spec.ts >> TEST-A11Y-01 catalogue: loaded, filtered, invalid and empty states
- Location: tests\accessibility\axe.spec.ts:30:1

# Error details

```
Error: catalogue-loaded: critical/serious axe findings: color-contrast, label-content-name-mismatch

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 276

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f4f6f4",
+               "contrastRatio": 4.41,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#66766d",
+               "fontSize": "9.6pt (12.8px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #66766d, background color: #f4f6f4, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<html lang=\"en\">",
+                 "target": Array [
+                   "html",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #66766d, background color: #f4f6f4, font size: 9.6pt (12.8px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<footer>Ten fictional worlds. A local catalogue for exploring and testing.</footer>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "footer",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+   Object {
+     "description": "Ensure that elements labelled through their content must have their visible text as part of their accessible name",
+     "help": "Elements must have their visible text as part of their accessible name",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=playwright",
+     "id": "label-content-name-mismatch",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Atlas Tactics to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "li:nth-child(1) > .favourite-button",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Ember Quest to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Ember Quest to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Ember Trail to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Ember Trail to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Iron Citadel to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Iron Citadel to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Moss Garden to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Moss Garden to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Neon Sprint to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Neon Sprint to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Orbit to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Orbit to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add ORBIT to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add ORBIT to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Zeta to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Zeta to favourites\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Add Écho to favourites\" aria-pressed=\"false\">Add to favourites</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "button[aria-label=\"Add Écho to favourites\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "wcag21a",
+       "wcag253",
+       "EN-301-549",
+       "EN-9.2.5.3",
+       "RGAAv4",
+       "RGAA-6.1.5",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]: Game Companion
    - navigation "Main" [ref=e4]:
      - link "Library" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "Favourites (0)" [ref=e6] [cursor=pointer]:
        - /url: /#/favourites
      - link "Feedback" [ref=e7] [cursor=pointer]:
        - /url: /#/feedback
  - main [active] [ref=e8]:
    - generic [ref=e9]:
      - paragraph [ref=e10]: THE LIBRARY
      - heading "Find your next world." [level=1] [ref=e11]
      - paragraph [ref=e12]: Explore the collection by title or genre.
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Search games
          - textbox "Search games" [ref=e16]:
            - /placeholder: Try Ember or Orbit
          - paragraph
        - generic [ref=e17]:
          - generic [ref=e18]: Genre
          - combobox "Genre" [ref=e19]:
            - option "All genres" [selected]
            - option "Action"
            - option "Adventure"
            - option "Puzzle"
            - option "Racing"
            - option "RPG"
            - option "Strategy"
        - button "Clear controls" [ref=e20] [cursor=pointer]
      - status [ref=e21]: 10 games
      - paragraph [ref=e22]: Results for search “All titles”; genre “All genres” · 10 games
      - list "Games" [ref=e23]:
        - listitem [ref=e24]:
          - link "Atlas Tactics" [ref=e25] [cursor=pointer]:
            - /url: /#/games/10
          - paragraph [ref=e26]: Strategy
          - button "Add Atlas Tactics to favourites" [ref=e27] [cursor=pointer]: Add to favourites
        - listitem [ref=e28]:
          - link "Ember Quest" [ref=e29] [cursor=pointer]:
            - /url: /#/games/6
          - paragraph [ref=e30]: RPG
          - button "Add Ember Quest to favourites" [ref=e31] [cursor=pointer]: Add to favourites
        - listitem [ref=e32]:
          - link "Ember Trail" [ref=e33] [cursor=pointer]:
            - /url: /#/games/5
          - paragraph [ref=e34]: Adventure
          - button "Add Ember Trail to favourites" [ref=e35] [cursor=pointer]: Add to favourites
        - listitem [ref=e36]:
          - link "Iron Citadel" [ref=e37] [cursor=pointer]:
            - /url: /#/games/8
          - paragraph [ref=e38]: Action
          - button "Add Iron Citadel to favourites" [ref=e39] [cursor=pointer]: Add to favourites
        - listitem [ref=e40]:
          - link "Moss Garden" [ref=e41] [cursor=pointer]:
            - /url: /#/games/9
          - paragraph [ref=e42]: Puzzle
          - button "Add Moss Garden to favourites" [ref=e43] [cursor=pointer]: Add to favourites
        - listitem [ref=e44]:
          - link "Neon Sprint" [ref=e45] [cursor=pointer]:
            - /url: /#/games/7
          - paragraph [ref=e46]: Racing
          - button "Add Neon Sprint to favourites" [ref=e47] [cursor=pointer]: Add to favourites
        - listitem [ref=e48]:
          - link "Orbit" [ref=e49] [cursor=pointer]:
            - /url: /#/games/1
          - paragraph [ref=e50]: Action
          - button "Add Orbit to favourites" [ref=e51] [cursor=pointer]: Add to favourites
        - listitem [ref=e52]:
          - link "ORBIT" [ref=e53] [cursor=pointer]:
            - /url: /#/games/2
          - paragraph [ref=e54]: RPG
          - button "Add ORBIT to favourites" [ref=e55] [cursor=pointer]: Add to favourites
        - listitem [ref=e56]:
          - link "Zeta" [ref=e57] [cursor=pointer]:
            - /url: /#/games/4
          - paragraph [ref=e58]: Strategy
          - button "Add Zeta to favourites" [ref=e59] [cursor=pointer]: Add to favourites
        - listitem [ref=e60]:
          - link "Écho" [ref=e61] [cursor=pointer]:
            - /url: /#/games/3
          - paragraph [ref=e62]: Puzzle
          - button "Add Écho to favourites" [ref=e63] [cursor=pointer]: Add to favourites
  - contentinfo [ref=e64]: Ten fictional worlds. A local catalogue for exploring and testing.
```

# Test source

```ts
  1  | import AxeBuilder from '@axe-core/playwright';
  2  | import { expect, type Page, type TestInfo } from '@playwright/test';
  3  | 
  4  | // Preserve every rule/result, including lower impacts and incomplete checks.
  5  | // The agreed release gate covers critical/serious findings, without exclusions.
  6  | export async function checkAccessibility(page: Page, info: TestInfo, state: string): Promise<void> {
  7  |   const results = await new AxeBuilder({ page }).analyze();
  8  |   await info.attach(`axe-${state}`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  9  |   const blocking = results.violations.filter(item => item.impact === 'critical' || item.impact === 'serious');
> 10 |   expect(blocking, `${state}: critical/serious axe findings: ${blocking.map(item => item.id).join(', ')}`).toEqual([]);
     |                                                                                                            ^ Error: catalogue-loaded: critical/serious axe findings: color-contrast, label-content-name-mismatch
  11 | }
  12 | 
```