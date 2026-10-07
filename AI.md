# How I used AI

Ремарка: Спочатку почав проект разом із SDD (Superpowers), але це займало дуже багато часу і токенів на моєму тарифному плані Claude. Тому перероблював з нуля за наступним алогритмом:

Plan -> Plan review in subagent -> Fix plan if needed -> Implement a plan in a new session from .md file

Окрім планів були і проміжкові промпти котрі не збереглись. Плани робились на extra high effort, імплементація на high.

[📁 plans](./plans) — всі покрокові плани, які використовувались під час розробки

## Rules

root CLAUDE.md
fe CLAUDE.md
be CLAUDE.md

## Skills
- grill-me для кожного плану
- commit для формування коміт меседжу та запобігання трейлу "Co-Authored by Claude"

## MCP
- Playwright - для тестування UI
- Inspo - для пошуку референсів для дизайну і його імплементації




