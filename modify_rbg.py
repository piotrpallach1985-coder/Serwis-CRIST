import re

with open('src/components/manager/PlannedMaintenanceRbgModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'useTranslation' not in content:
    content = "import { useTranslation } from 'react-i18next';\n" + content

if 'useTranslation()' not in content:
    content = content.replace("export default function PlannedMaintenanceRbgModal({ rbgUpdateModal, newRbgValue, setNewRbgValue, onSubmit, onClose }) {", "export default function PlannedMaintenanceRbgModal({ rbgUpdateModal, newRbgValue, setNewRbgValue, onSubmit, onClose }) {\n  const { t } = useTranslation();")

content = content.replace("Aktualizuj licznik maszyny", "{t('planned.update_machine_counter')}")
content = content.replace("Nowy stan licznika (rbg)", "{t('planned.new_counter_state')}")
content = content.replace("Anuluj", "{t('planned.cancel')}")
content = content.replace("Zapisz", "{t('planned.save')}")

with open('src/components/manager/PlannedMaintenanceRbgModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
