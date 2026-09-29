import re

with open('src/components/manager/PlannedMaintenanceFilters.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTranslation } from 'react-i18next';")

if 'useTranslation()' not in content:
    content = content.replace("viewMode, setViewMode\n}) {", "viewMode, setViewMode\n}) {\n  const { t } = useTranslation();")

content = content.replace("placeholder=\"Szukaj (maszyna, serwis)...\"", "placeholder={t('planned.search_placeholder')}")
content = content.replace(">Wszystkie<", ">{t('planned.all')}<")
content = content.replace(">Najbliższe 30 dni<", ">{t('planned.next_30_days')}<")
content = content.replace(">Najbliższe 90 dni<", ">{t('planned.next_90_days')}<")
content = content.replace("title=\"Filtruj po miesiącu wykonania\"", "title={t('planned.filter_month')}")
content = content.replace(">Wszystkie Rejony<", ">{t('planned.all_regions')}<")
content = content.replace(">Wszystkie Maszyny<", ">{t('planned.all_machines')}<")
content = content.replace("Wyczyść filtry", "{t('planned.clear_filters')}")
content = content.replace("Kolumny", "{t('planned.columns')}")

content = content.replace("Typ Serwisu", "{t('planned.col_service_type')}")
content = content.replace("Maszyna<", "{t('planned.col_machine')}<")
content = content.replace("Rejon<", "{t('planned.col_region')}<")
content = content.replace("Termin (Kalendarz)", "{t('planned.col_date_calendar')}")
content = content.replace("Termin (RBG)", "{t('planned.col_date_rbg')}")
content = content.replace("Priorytet", "{t('planned.col_priority')}")
content = content.replace("Status<", "{t('planned.col_status')}<")

with open('src/components/manager/PlannedMaintenanceFilters.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
