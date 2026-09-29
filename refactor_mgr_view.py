import re

with open('src/components/ManagerView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace imports
content = re.sub(
    r"import \{ useState, useEffect \} from 'react';\r?\nimport \{ useParams, useNavigate, useSearchParams, useLocation \} from 'react-router-dom';",
    "import { useState, useEffect } from 'react';\nimport { useManagerRouting } from '../hooks/useManagerRouting';",
    content
)

# 2. Extract logic
start_str = "    const { module: routeModule, tab: routeTab } = useParams();"
end_str = "  const [globalPlannedSearchQuery, setGlobalPlannedSearchQuery] = useState('');\n\n  const clearUrlParam = (paramName) => {\n    setSearchParams(prev => {\n      const newParams = new URLSearchParams(prev);\n      newParams.delete(paramName);\n      return newParams;\n    }, { replace: true, state: location.state });\n  };"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_str)
    
    new_logic = """    const {
        currentModule, setCurrentModule,
        activeTab, setActiveTab,
        handleTabChange,
        handleNavigate,
        clearUrlParam,
        globalTicketId, setGlobalTicketId,
        globalServiceId, setGlobalServiceId,
        globalMachineId, setGlobalMachineId,
        getModuleTitle
    } = useManagerRouting();

    const [globalTicketSearchQuery, setGlobalTicketSearchQuery] = useState('');
    const [globalPlannedSearchQuery, setGlobalPlannedSearchQuery] = useState('');"""
    
    content = content[:start_idx] + new_logic + content[end_idx:]

# Remove handleNavigate and getModuleTitle from further down
content = re.sub(r"    // --- Nawigacja wewnątrz Menedżera ---[\s\S]*?navigate\(`/manager/\$\{module\}/\$\{tab\}\$\{searchString\}`\);\n  \};\n", "", content)
content = re.sub(r"  const getModuleTitle = \(\) => \{[\s\S]*?return 'System CMMS';\n  \};\n", "", content)

with open('src/components/ManagerView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Refactored ManagerView successfully")
