# Manual / exploratory session — template

Status: Work in progress. 

- Tester: Vadim Lebedev
- Date/time/timezone: 2026-10-09 +4 UTC START 8:16 PM
- Browser/version: Mozila Firefox 157.0.1 (64-bit)
- OS/version: Windows 11 Pro for Workstations 10.0.26200 Build 26200
- Viewport: 766 × 577
- Base URL: http://127.0.0.1:3000
- Commit and uncommitted changes: b3b0dc4e12e3aa5a2e6bcafd8d88065ae9b435bd and 240 new files
- DB_PATH: "D:\Projects\WEB_DEV\WEB-DEV-QA-Portfolio\test-results\manual-de812a27fa824044808819c98dafc95d\games.sqlite"
* fixture version: v1
- Planned / actual duration: 60 min / 60 min

## Scripted manual checks

Record one row per executed scenario variant; leave unexecuted variants unexecuted.

| SCN ID / variant | Preconditions / exact input and steps | Expected | Actual | Result | Evidence / BUG / SIM |
| ---------------- | ------------------------------------- | -------- | ------ | ------ | -------------------- |
|                  |                                       |          |        |        |                      |

## Exploratory charter

Explore [specific target] with [tools / data / conditions] to discover [information].

## Session log

| Time | Action / exact input | Observation | Tag (NOTE / QUESTION / RISK / BUG / IDEA) | Evidence / follow-up |
| --- | --- | --- | --- | --- |
| | | | | |

## Debrief

- Covered:
- Partially explored:
- Unexplored / reason:
- Reproducible defects / expected vs actual / exact reproduction steps:
- Unconfirmed observations:
- Simulated conditions and injection method:
- What was learned:
- Next investigation / test ideas:


***
# Notes:

## Search games: 
Test cases:
### 1 test case
Check the field on ==0==

expected result: show games with 0 in name
actual result: in this version No games found, because we don't have any game with 0 in name
pass
comm: we need a test game with 0 in name
### 2 test case
Check the field on ==1==

expected result: show games with 1 in name
actual result: in this version No games found, because we don't have any game with 1 in name
pass
comm: we need a test game with 1 in name
### 3 test case
Check the filed on symbols 

expected result: 0 games found, platform doesn't allow to place a game with symbols in name
actual result: No games found
pass
### 4 test case
Search must be 80 characters or fewer

expected result: user can write in field at 0 to 80 characters, no more 
actual result: in API requests I see we don't get more 80 characters, but in client version we can write in field more than 80 characters 
fail


### 5 test case
Search with 79 characters 

expected result: Field work correctly when we trying to find a game with 79 characters in name
actual result: Blocked, we can't check the filed without test game it list
block
comm: we need a test game with 1 in name

### 6 test case
Use another alphabet

expected result: No games found
actual result: No games found
pass
comm: we don't post a game in another language

### 7 test case
81 characters in field

expected result: In field we don't get more 80 characters.
actual result: in API requests I see we don't get more 80 characters, but in client version we can write in field more than 80 characters 
fail


## Genre 
Test cases: 

### 1 test case
Genre match with game card

expected result: Chosen genre was show in results for search all games with this genre
actual result:  Action✅, Racing.✅, Strategy✅
pass
comm: We don't have any games with two or more genres, for next version we need to add more test cards

## Clear controls 
Test cases:

### 1 test case
Click on clear games send /api/games

expected result: filed "Search games" and picked "Genre" go to clear filed and all genres
actual result: request was sent, response was correct. Field after click on Clear controls become clear and genre become Action -> All genres GET 200
pass

## Combined Search games and Genre
Test cases:

### 1 test case
Search with Genre working on AND logic

expected result: Genre: Strategy with Search request: "A/At/Atl/Atla/Atlas", show only "Atlas Tactics", without "Zeta". Don't show games with name "Atlas" or in genre strategy
actual result: showed only "Atlas Tactics"
pass

## Game card
Test cases:

### 1 test case
The Click on card send request  api/games/id

expected result: open game card with his description and patch notes
actual result: page was opened, description, link on patch notes, and other require fields  showed GET 200
pass

### 2 test case
The Click on patch notes send request  api/games/id/patch-notes

expected result: game cards patch notes with his description 
actual result: in description of patch notes "No patch notes available" GET 200
pass

## Back
Test cases:

### 1 test case 
/api/games

expected result: back to main page with clear field Search games and default Genre
actual result: Page loaded correct, conditions observed GET 200
pass