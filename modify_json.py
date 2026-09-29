import json

dictPl = {
  "status_completed": "Zakończone",
  "status_in_progress": "W trakcie",
  "status_overdue": "Przekroczony",
  "status_pending": "Oczekuje",
  "details_btn": "Szczegóły",
  "critical": "Krytyczne",
  "high": "Wysoki",
  "standard": "Standard",
  "load_more": "Załaduj kolejne 30 (pozostało",
  "empty_title": "Brak wyników",
  "empty_message": "Brak serwisów pasujących do kryteriów.",
  "unknown_machine": "Nieznana maszyna",
  "machine_deleted": "(maszyna usunięta)",
  "completed_date": "Zakończono:"
}

dictEn = {
  "status_completed": "Completed",
  "status_in_progress": "In progress",
  "status_overdue": "Overdue",
  "status_pending": "Pending",
  "details_btn": "Details",
  "critical": "Critical",
  "high": "High",
  "standard": "Standard",
  "load_more": "Load next 30 (remaining",
  "empty_title": "No results",
  "empty_message": "No services match criteria.",
  "unknown_machine": "Unknown machine",
  "machine_deleted": "(machine deleted)",
  "completed_date": "Completed:"
}

with open('src/locales/pl/translation.json', 'r', encoding='utf-8-sig') as f:
    pl = json.load(f)
if pl.get('planned') is None:
    pl['planned'] = {}
for k, v in dictPl.items():
    pl['planned'][k] = v
with open('src/locales/pl/translation.json', 'w', encoding='utf-8') as f:
    json.dump(pl, f, indent=2, ensure_ascii=False)

with open('src/locales/en/translation.json', 'r', encoding='utf-8-sig') as f:
    en = json.load(f)
if en.get('planned') is None:
    en['planned'] = {}
for k, v in dictEn.items():
    en['planned'][k] = v
with open('src/locales/en/translation.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
