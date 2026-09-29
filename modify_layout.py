import re

with open('src/components/manager/PlannedMaintenanceLayout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTranslation } from 'react-i18next';")

if 'useTranslation()' not in content:
    content = content.replace("const ticketsStore = useManagerStore", "const { t } = useTranslation();\n  const ticketsStore = useManagerStore")

content = content.replace("label: 'KPI'", "label: t('planned.tab_kpi')")
content = content.replace("label: 'Mapa'", "label: t('planned.tab_map')")
content = content.replace("label: 'Lista'", "label: t('planned.tab_list')")
content = content.replace("label: 'Zadania'", "label: t('planned.tab_tasks')")
content = content.replace("label: 'Archiwum'", "label: t('planned.tab_archive')")

with open('src/components/manager/PlannedMaintenanceLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
