import re

with open('src/components/manager/PlannedKPIDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = content.replace("import React, {", "import React, {")
    content = content.replace("import React", "import React\nimport { useTranslation } from 'react-i18next';")
    if 'useTranslation' not in content:
        content = "import { useTranslation } from 'react-i18next';\n" + content

if 'useTranslation()' not in content:
    content = content.replace("export default function PlannedKPIDashboard() {", "export default function PlannedKPIDashboard() {\n  const { t } = useTranslation();")

content = content.replace("KPI / Status Serwisów", "{t('planned.kpi_title')}")
content = content.replace("Analiza prac prewencyjnych", "{t('planned.kpi_subtitle')}")
content = content.replace(">Ostatnie 7 dni<", ">{t('planned.last_7_days')}<")
content = content.replace(">Ostatnie 30 dni<", ">{t('planned.last_30_days')}<")
content = content.replace(">Ostatnie 90 dni<", ">{t('planned.last_90_days')}<")
content = content.replace(">Ostatni rok<", ">{t('planned.last_year')}<")
content = content.replace("Generuj PDF", "{t('planned.generate_pdf')}")

content = content.replace(">Serwisy łącznie<", ">{t('planned.total_services')}<")
content = content.replace(">Zrealizowane<", ">{t('planned.completed')}<")
content = content.replace(">Opóźnione<", ">{t('planned.overdue')}<")
content = content.replace(">Średni czas zwłoki<", ">{t('planned.avg_delay')}<")
content = content.replace(">godz.<", ">{t('planned.hours')}<")

content = content.replace("Zrealizowane vs Zaplanowane w czasie", "{t('planned.completed_vs_planned')}")
content = content.replace("dataKey=\"Zrealizowane\"", "dataKey={t('planned.completed')}")
content = content.replace("dataKey=\"Zaplanowane\"", "dataKey={t('planned.planned')}")

content = content.replace("Serwisy wg Rejonów", "{t('planned.services_by_region')}")
content = content.replace("Brak danych w wybranym okresie", "{t('planned.no_data')}")

with open('src/components/manager/PlannedKPIDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
