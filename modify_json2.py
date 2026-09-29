import json

dictPl = {
  "note_add_error": "Błąd dodawania notatki:",
  "excel_id": "ID Serwisu",
  "excel_name": "Nazwa Serwisu",
  "excel_machine": "Maszyna",
  "excel_priority": "Priorytet",
  "excel_trigger": "Typ Wyzwalacza",
  "excel_date": "Data Wykonania/Oczekiwana",
  "excel_rbg": "Cel RBG",
  "excel_status": "Status",
  "excel_history": "Historia",
  "trigger_rbg": "RBG",
  "trigger_calendar": "Kalendarz",
  "trigger_mixed": "Mieszany",
  "archive_title": "Archiwum Serwisów",
  "archive_subtitle": "Historia zakończonych prac prewencyjnych",
  "main_title": "Serwis Planowany",
  "main_subtitle": "Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin",
  "export_excel": "Eksport Excel",
  "view_list": "Lista",
  "view_calendar": "Kalendarz",
  "add_plan": "Dodaj Plan",
  "loading": "Wczytywanie...",
  "load_older": "Wczytaj starsze serwisy"
}

dictEn = {
  "note_add_error": "Error adding note:",
  "excel_id": "Service ID",
  "excel_name": "Service Name",
  "excel_machine": "Machine",
  "excel_priority": "Priority",
  "excel_trigger": "Trigger Type",
  "excel_date": "Expected/Execution Date",
  "excel_rbg": "Target MTH",
  "excel_status": "Status",
  "excel_history": "History",
  "trigger_rbg": "MTH",
  "trigger_calendar": "Calendar",
  "trigger_mixed": "Mixed",
  "archive_title": "Services Archive",
  "archive_subtitle": "History of completed preventive works",
  "main_title": "Planned Service",
  "main_subtitle": "Preventive maintenance, schedules and MTH counters",
  "export_excel": "Export Excel",
  "view_list": "List",
  "view_calendar": "Calendar",
  "add_plan": "Add Plan",
  "loading": "Loading...",
  "load_older": "Load older services"
}

with open('src/locales/pl/translation.json', 'r', encoding='utf-8-sig') as f:
    pl = json.load(f)
for k, v in dictPl.items():
    pl['planned'][k] = v
with open('src/locales/pl/translation.json', 'w', encoding='utf-8') as f:
    json.dump(pl, f, indent=2, ensure_ascii=False)

with open('src/locales/en/translation.json', 'r', encoding='utf-8-sig') as f:
    en = json.load(f)
for k, v in dictEn.items():
    en['planned'][k] = v
with open('src/locales/en/translation.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
