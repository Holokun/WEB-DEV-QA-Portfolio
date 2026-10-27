# Game Companion: spoken interface observations

Status: **partial; required announcement review remains open**. The application is the test subject; Windows Narrator is the assistive tool. These observations do not test or certify Narrator itself.

The existing SCN-A11Y-01 charter requires checking useful spoken feedback for loading, empty results, request errors, validation and successful feedback submission. The user explicitly approved launching the installed Narrator and switching it off after this check on2026-10-27. Earlier permission rejection is historical, not a claim that this later launch was denied.

Environment: Windows Narrator executable version10.0.26100.8972; Game Companion from clean committed checkout `1ec3aa5082851c47a471e20ec14a0b34f8b762d0`, initially at `http://127.0.0.1:58730`; ChatGPT in-app browser. Its browser-engine version was not independently recorded for this observation. Tester: Codex agent, not Vadim. No Narrator preferences, security settings or startup configuration were changed.

After launch, the Speech recap window was observed directly. Its accessibility-tree content was limited by Windows integrity levels; its screenshot was readable without changing those protections. The saved [unmodified Speech recap image](evidence/narrator-2026-10-27/initial-speech-recap.png), captured at2026-10-27 06:45:38 UTC, contains actual Narrator output identifying “Game Companion document main landmark” and “Search games, edit, Try Ember or Orbit”. This supports the main landmark and search-field spoken identification only. It is actual screen-reader output, distinct from a DOM or axe assertion.

No evidence was captured for the remaining required loading/no-results/error/validation/confirmation announcements. They are **not passed**, and absence of captured evidence does not establish an application defect. The full local583-test regression and automated aria/status assertions do not replace this remaining check. Later reconnection attempts to the original development URL received a connection refusal; the development process must be revalidated before continuing.

Cleanup inspection on2026-10-27 confirmed that no Narrator process was running. No additional launch or settings change was made during that inspection. The separate clean-checkout functional journey subsequently used a recorded development-server continuation; this does not add speech evidence to the screenshot above.
