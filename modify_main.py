import re

with open('src/components/manager/PlannedMaintenance.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = content.replace("import React, {", "import { useTranslation } from 'react-i18next';\nimport React, {")
    if 'useTranslation' not in content:
        content = "import { useTranslation } from 'react-i18next';\n" + content

if 'useTranslation()' not in content:
    content = content.replace("export default function PlannedMaintenance({", "export default function PlannedMaintenance({\n  const { t } = useTranslation();")
    content = re.sub(r'(export default function PlannedMaintenance\([^)]+\)\s*\{)', r'\1\n  const { t } = useTranslation();', content)

# It's better to replace exact strings to not mess up the rest.
content = content.replace("'Błąd dodawania notatki: '", "t('planned.note_add_error') + ' '")
content = content.replace("'ID Serwisu'", "t('planned.excel_id')")
content = content.replace("'Nazwa Serwisu'", "t('planned.excel_name')")
content = content.replace("'Maszyna'", "t('planned.excel_machine')")
content = content.replace("'Priorytet'", "t('planned.excel_priority')")
content = content.replace("'Typ Wyzwalacza'", "t('planned.excel_trigger')")
content = content.replace("'Data Wykonania/Oczekiwana'", "t('planned.excel_date')")
content = content.replace("'Cel RBG'", "t('planned.excel_rbg')")
content = content.replace("'Status'", "t('planned.excel_status')")
content = content.replace("'Historia'", "t('planned.excel_history')")

content = content.replace("'Krytyczny'", "t('planned.critical')")
content = content.replace("'Standard'", "t('planned.standard')")
content = content.replace("'Zakończony'", "t('planned.status_completed')")
content = content.replace("'W trakcie'", "t('planned.status_in_progress')")
content = content.replace("'Oczekujący'", "t('planned.status_pending')")
content = content.replace("'RBG'", "t('planned.trigger_rbg')")
content = content.replace("'Kalendarz'", "t('planned.trigger_calendar')")
content = content.replace("'Mieszany'", "t('planned.trigger_mixed')")

content = content.replace("'Archiwum Serwisów'", "t('planned.archive_title')")
content = content.replace("'Historia zakończonych prac prewencyjnych'", "t('planned.archive_subtitle')")
content = content.replace("'Serwis Planowany'", "t('planned.main_title')")
content = content.replace("'Konserwacja prewencyjna, harmonogramy i liczniki roboczogodzin'", "t('planned.main_subtitle')")

content = content.replace("Eksport Excel", "{t('planned.export_excel')}")
content = content.replace(" Lista", " {t('planned.view_list')}")
content = content.replace(" Kalendarz", " {t('planned.view_calendar')}")
content = content.replace("Dodaj Plan", "{t('planned.add_plan')}")
content = content.replace("'Wczytywanie...'", "t('planned.loading')")
content = content.replace("'Wczytaj starsze serwisy'", "t('planned.load_older')")

with open('src/components/manager/PlannedMaintenance.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
