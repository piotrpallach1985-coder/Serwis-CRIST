import re

with open('src/components/manager/PlannedMaintenanceList.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = content.replace("import EmptyState", "import { useTranslation } from 'react-i18next';\nimport EmptyState")

if 'useTranslation()' not in content:
    content = content.replace("export default function PlannedMaintenanceList({", "export default function PlannedMaintenanceList({\n  const { t } = useTranslation();")
    # Wait, the signature has destructured props, let's insert it inside the function body
    content = re.sub(r'(export default function PlannedMaintenanceList\([^)]+\)\s*\{)', r'\1\n  const { t } = useTranslation();', content)


content = content.replace("Zakończone", "{t('planned.status_completed')}")
content = content.replace("W trakcie", "{t('planned.status_in_progress')}")
content = content.replace("Przekroczony", "{t('planned.status_overdue')}")
content = content.replace("Oczekuje", "{t('planned.status_pending')}")
content = content.replace("Szczegóły", "{t('planned.details_btn')}")
content = content.replace("KRYTYCZNE", "{t('planned.critical').toUpperCase()}")
content = content.replace("Wysoki", "{t('planned.high')}")
content = content.replace("Standard", "{t('planned.standard')}")
content = content.replace("Załaduj kolejne 30 (pozostało", "{t('planned.load_more')} ")
content = content.replace("Brak wyników", "{t('planned.empty_title')}")
content = content.replace("Brak serwisów pasujących do kryteriów.", "{t('planned.empty_message')}")
content = content.replace("Nieznana maszyna", "{t('planned.unknown_machine')}")
content = content.replace("(maszyna usunięta)", "{t('planned.machine_deleted')}")
content = content.replace("Zakończono:", "{t('planned.completed_date')}")

with open('src/components/manager/PlannedMaintenanceList.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
