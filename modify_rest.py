import json
import re

dictPl = {
  "delete_btn": "Usuń",
  "history_title": "HISTORIA ZDARZEŃ",
  "system": "System",
  "no_history": "Brak historii zdarzeń.",
  "checklist_title": "Lista Kontrolna:",
  "done": "Wykonano",
  "skipped": "Pominięto",
  "no_main_photo": "Brak zdjęcia głównego",
  "no_data_short": "Brak danych",
  "note_label": "Notatka: ",
  "error": "Błąd: ",
  "complete_service": "Zakończ Serwis",
  "confirm_parts": "Potwierdzam zużycie wymaganych części",
  "exec_notes": "Notatki z wykonania",
  "auto_next_plan": "Wygeneruj automatycznie kolejny termin przeglądu",
  "add_to_tasks": "Dodaj do Tematy do Realizacji",
  "problem_desc": "Opis problemu *",
  "expected_date": "Oczekiwany termin",
  "confirm_exec": "Zatwierdź Wykonanie",
  "add_service": "Dodaj Serwis",
  "edit_service": "Edytuj Serwis",
  "service_name": "Nazwa serwisu",
  "machine_status": "Wymagany status maszyny podczas serwisu",
  "required_personnel": "Wymagany personel / kwalifikacje",
  "required_tools": "Wymagane narzędzia",
  "required_parts": "Wymagane części (Rezerwacje)"
}

with open('src/locales/pl/translation.json', 'r', encoding='utf-8-sig') as f:
    pl = json.load(f)
for k, v in dictPl.items():
    pl['planned'][k] = v
with open('src/locales/pl/translation.json', 'w', encoding='utf-8') as f:
    json.dump(pl, f, indent=2, ensure_ascii=False)

def inject(file, replaces):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'useTranslation' not in content:
        content = content.replace("import React", "import React\nimport { useTranslation } from 'react-i18next';")
    if 'useTranslation()' not in content:
        content = re.sub(r'(export default function [^\(]+\([^)]*\)\s*\{)', r'\1\n  const { t } = useTranslation();', content)
    for old, new in replaces.items():
        content = content.replace(old, new)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

inject('src/components/manager/PlannedMaintenanceDetails.jsx', {
    "Usuń": "{t('planned.delete_btn')}",
    "HISTORIA ZDARZEŃ": "{t('planned.history_title')}",
    "'System'": "t('planned.system')",
    "Brak historii zdarzeń.": "{t('planned.no_history')}",
    "Lista Kontrolna:": "{t('planned.checklist_title')}",
    "Wykonano": "{t('planned.done')}",
    "Pominięto": "{t('planned.skipped')}",
    "'Brak zdjęcia głównego'": "t('planned.no_main_photo')",
    "'Brak danych'": "t('planned.no_data_short')"
})

inject('src/components/manager/PlannedMaintenanceCompletionModal.jsx', {
    "Zakończ Serwis": "{t('planned.complete_service')}",
    "Potwierdzam zużycie wymaganych części": "{t('planned.confirm_parts')}",
    "Notatki z wykonania": "{t('planned.exec_notes')}",
    "Wygeneruj automatycznie kolejny termin przeglądu": "{t('planned.auto_next_plan')}",
    "Dodaj do Tematy do Realizacji": "{t('planned.add_to_tasks')}",
    "Opis problemu *": "{t('planned.problem_desc')}",
    "Oczekiwany termin": "{t('planned.expected_date')}",
    "Zatwierdź Wykonanie": "{t('planned.confirm_exec')}"
})

inject('src/components/manager/PlannedMaintenanceFormModal.jsx', {
    "Wymagany status maszyny podczas serwisu": "{t('planned.machine_status')}",
    "Wymagany personel / kwalifikacje": "{t('planned.required_personnel')}",
    "Wymagane narzędzia": "{t('planned.required_tools')}",
    "Wymagane części (Rezerwacje)": "{t('planned.required_parts')}"
})

