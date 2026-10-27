# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility\axe.spec.ts >> TEST-A11Y-02 feedback: normal, invalid, request error, pending and real success
- Location: tests\accessibility\axe.spec.ts:105:1

# Error details

```
Error: feedback-ready: critical/serious axe findings: color-contrast

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 58

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
      - link "Back" [ref=e10] [cursor=pointer]:
        - /url: /
      - paragraph [ref=e11]: SHARE YOUR EXPERIENCE
      - heading "Feedback" [level=1] [ref=e12]
      - paragraph [ref=e13]: Choose a game and tell us about your experience.
      - status [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: Game
          - combobox "Game" [ref=e18]:
            - option "Choose a game" [selected]
            - option "Atlas Tactics"
            - option "Ember Quest"
            - option "Ember Trail"
            - option "Iron Citadel"
            - option "Moss Garden"
            - option "Neon Sprint"
            - option "Orbit"
            - option "ORBIT"
            - option "Zeta"
            - option "Écho"
          - paragraph
        - generic [ref=e19]:
          - generic [ref=e20]: Email
          - textbox "Email" [ref=e21]
          - paragraph
        - generic [ref=e22]:
          - generic [ref=e23]: Description
          - textbox "Description" [ref=e24]
          - paragraph [ref=e25]: At least 20 characters after trimming spaces.
          - paragraph
        - button "Submit feedback" [ref=e26] [cursor=pointer]
  - contentinfo [ref=e27]: Ten fictional worlds. A local catalogue for exploring and testing.
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
     |                                                                                                            ^ Error: feedback-ready: critical/serious axe findings: color-contrast
  11 | }
  12 | 
```