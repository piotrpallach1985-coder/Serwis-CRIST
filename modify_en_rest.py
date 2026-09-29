import json

dictEn = {
  "delete_btn": "Delete",
  "history_title": "EVENTS HISTORY",
  "system": "System",
  "no_history": "No event history.",
  "checklist_title": "Checklist:",
  "done": "Done",
  "skipped": "Skipped",
  "no_main_photo": "No main photo",
  "no_data_short": "No data",
  "note_label": "Note: ",
  "error": "Error: ",
  "complete_service": "Complete Service",
  "confirm_parts": "I confirm usage of required parts",
  "exec_notes": "Execution notes",
  "auto_next_plan": "Automatically generate next schedule",
  "add_to_tasks": "Add to Action Items",
  "problem_desc": "Problem description *",
  "expected_date": "Expected date",
  "confirm_exec": "Confirm Execution",
  "add_service": "Add Service",
  "edit_service": "Edit Service",
  "service_name": "Service name",
  "machine_status": "Required machine status during service",
  "required_personnel": "Required personnel / qualifications",
  "required_tools": "Required tools",
  "required_parts": "Required parts (Reservations)"
}

with open('src/locales/en/translation.json', 'r', encoding='utf-8-sig') as f:
    en = json.load(f)
for k, v in dictEn.items():
    en['planned'][k] = v
with open('src/locales/en/translation.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
