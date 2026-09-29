import json
import re

with open('src/locales/pl/translation.json', 'r', encoding='utf-8') as f:
    pl = json.load(f)
with open('src/locales/en/translation.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

# Sidebar strings to add
new_sidebar_strings = {
    "archive_tickets_menu": {"pl": "Archiwum Awarii", "en": "Tickets Archive"},
    "action_items_menu": {"pl": "Tematy do realizacji", "en": "Action Items"},
    "archive_services_menu": {"pl": "Archiwum serwisów", "en": "Services Archive"},
    "warehouse_parts_menu": {"pl": "Magazyn Części Zapasowych", "en": "Spare Parts Warehouse"},
    "kpi_status_menu": {"pl": "KPI / Status", "en": "KPI / Status"},
    "warehouse_base_menu": {"pl": "Baza Magazynowa", "en": "Warehouse Base"},
    "warehouse_operations_menu": {"pl": "Operacje magazynowe", "en": "Warehouse Operations"},
    "qr_summary_menu": {"pl": "Zestawienie QR", "en": "QR Summary"},
    "equipment_base_menu": {"pl": "Baza Urządzeń", "en": "Equipment Base"},
    "regions_menu": {"pl": "Rejony", "en": "Regions"},
    "subcontractors_menu": {"pl": "Podwykonawcy / Serwisy", "en": "Subcontractors / Services"},
    "ticket_topics_menu": {"pl": "Tematy Zgłoszeń", "en": "Ticket Topics"},
    "reporters_menu": {"pl": "Zgłaszający", "en": "Reporters"},
    "users_menu": {"pl": "Użytkownicy", "en": "Users"},
    "roles_permissions_menu": {"pl": "Role i Uprawnienia", "en": "Roles & Permissions"},
    "reporting_menu": {"pl": "Raportowanie", "en": "Reporting"},
    "audit_logs_menu": {"pl": "Dziennik Zdarzeń", "en": "Audit Logs"},
    "ai_usage_menu": {"pl": "Zużycie AI", "en": "AI Usage"},
    "saas_management_menu": {"pl": "Zarządzanie SaaS", "en": "SaaS Management"},
    "main_menu": {"pl": "Główny", "en": "Main"},
    "logout_menu": {"pl": "Wyloguj", "en": "Logout"}
}

for k, v in new_sidebar_strings.items():
    pl['sidebar'][k] = v['pl']
    en['sidebar'][k] = v['en']

# Ensure dashboards and superadmin exist
for d in ['dashboards', 'superadmin']:
    if d not in pl:
        pl[d] = {}
    if d not in en:
        en[d] = {}

with open('src/locales/pl/translation.json', 'w', encoding='utf-8') as f:
    json.dump(pl, f, ensure_ascii=False, indent=2)
with open('src/locales/en/translation.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)

# Now fix Sidebar.jsx
with open('src/components/manager/Sidebar.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'<span className="text-sm">Archiwum Awarii</span>', r'<span className="text-sm">{t("sidebar.archive_tickets_menu")}</span>'),
    (r'<span className="text-sm truncate">Tematy do realizacji</span>', r'<span className="text-sm truncate">{t("sidebar.action_items_menu")}</span>'),
    (r'<span className="text-sm">Archiwum serwisów</span>', r'<span className="text-sm">{t("sidebar.archive_services_menu")}</span>'),
    (r'<span>Magazyn Części Zapasowych</span>', r'<span>{t("sidebar.warehouse_parts_menu")}</span>'),
    (r'<span className="text-sm">KPI / Status</span>', r'<span className="text-sm">{t("sidebar.kpi_status_menu")}</span>'),
    (r'<span className="text-sm truncate">Baza Magazynowa</span>', r'<span className="text-sm truncate">{t("sidebar.warehouse_base_menu")}</span>'),
    (r'<span className="text-sm">Operacje magazynowe</span>', r'<span className="text-sm">{t("sidebar.warehouse_operations_menu")}</span>'),
    (r'<span className="text-sm">Zestawienie QR</span>', r'<span className="text-sm">{t("sidebar.qr_summary_menu")}</span>'),
    (r'<span className="text-sm truncate">Baza Urządzeń</span>', r'<span className="text-sm truncate">{t("sidebar.equipment_base_menu")}</span>'),
    (r'<span className="text-sm">Rejony</span>', r'<span className="text-sm">{t("sidebar.regions_menu")}</span>'),
    (r'<span className="text-sm">Podwykonawcy / Serwisy</span>', r'<span className="text-sm">{t("sidebar.subcontractors_menu")}</span>'),
    (r'<span className="text-sm">Tematy Zgłoszeń</span>', r'<span className="text-sm">{t("sidebar.ticket_topics_menu")}</span>'),
    (r'<span className="text-sm truncate">Zgłaszający</span>', r'<span className="text-sm truncate">{t("sidebar.reporters_menu")}</span>'),
    (r'<span className="text-sm">Użytkownicy</span>', r'<span className="text-sm">{t("sidebar.users_menu")}</span>'),
    (r'<span className="text-sm">Role i Uprawnienia</span>', r'<span className="text-sm">{t("sidebar.roles_permissions_menu")}</span>'),
    (r'<span className="text-sm">Raportowanie</span>', r'<span className="text-sm">{t("sidebar.reporting_menu")}</span>'),
    (r'<span className="text-sm">Dziennik Zdarzeń</span>', r'<span className="text-sm">{t("sidebar.audit_logs_menu")}</span>'),
    (r'<span className="text-sm">Zużycie AI</span>', r'<span className="text-sm">{t("sidebar.ai_usage_menu")}</span>'),
    (r'<span>Zarządzanie SaaS</span>', r'<span>{t("sidebar.saas_management_menu")}</span>'),
    (r'<span>Główny</span>', r'<span>{t("sidebar.main_menu")}</span>'),
    (r'<span>Wyloguj</span>', r'<span>{t("sidebar.logout_menu")}</span>'),
]

# Note: Sometimes there might be encoding issues with polish letters in regex. Let's just use string replace.
for old, new in replacements:
    content = content.replace(old, new)

with open('src/components/manager/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Sidebar updated.")
