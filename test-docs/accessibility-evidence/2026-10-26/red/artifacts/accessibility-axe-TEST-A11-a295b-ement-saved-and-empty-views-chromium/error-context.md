# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility\axe.spec.ts >> TEST-A11Y-01 favourites supplement: saved and empty views
- Location: tests\accessibility\axe.spec.ts:148:1

# Error details

```
Error: favourites-saved: critical/serious axe findings: color-contrast, label-content-name-mismatch

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 96

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
+         "html": "<button type=\"button\" class=\"favourite-button\" aria-label=\"Remove Orbit from favourites\" aria-pressed=\"true\">Remove favourite</button>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".favourite-button",
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
      - link "Favourites (1)" [ref=e6] [cursor=pointer]:
        - /url: /#/favourites
      - link "Feedback" [ref=e7] [cursor=pointer]:
        - /url: /#/feedback
  - main [active] [ref=e8]:
    - generic [ref=e9]:
      - paragraph [ref=e10]: YOUR COLLECTION
      - heading "Favourites" [level=1] [ref=e11]
      - paragraph [ref=e12]: Keep your next worlds close at hand.
      - status [ref=e13]: 1 favourite
      - list "Favourite games" [ref=e14]:
        - listitem [ref=e15]:
          - link "Orbit" [ref=e16] [cursor=pointer]:
            - /url: /#/games/1
          - paragraph [ref=e17]: Action
          - button "Remove Orbit from favourites" [pressed] [ref=e18] [cursor=pointer]: Remove favourite
  - contentinfo [ref=e19]: Ten fictional worlds. A local catalogue for exploring and testing.
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
     |                                                                                                            ^ Error: favourites-saved: critical/serious axe findings: color-contrast, label-content-name-mismatch
  11 | }
  12 | 
```