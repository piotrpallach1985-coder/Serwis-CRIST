import re

with open('src/components/OperatorForm.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace imports
content = re.sub(
    r"import \{ useToast \} from '\.\./hooks/useToast';\r?\nimport \{ useTicketSubmit \} from '\.\./hooks/useTicketSubmit';",
    "import { useOperatorForm } from '../hooks/useOperatorForm';",
    content
)

# Also remove unneeded imports
content = re.sub(r"import \{ ref, uploadBytes, uploadString, getDownloadURL \} from 'firebase/storage';\r?\n", "", content)
content = re.sub(r"import \{ compressImage \} from '\.\./utils/imageCompressor';\r?\n", "", content)

# 2. Extract block
start_str = "const [topicMode, setTopicMode] = useState('select');"
end_str = "setLoading(false);\n  };"
start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_str)
    
    new_logic = """const {
    topicMode, setTopicMode,
    topic, setTopic,
    description, setDescription,
    reporterName, setReporterName,
    reporterPhone, setReporterPhone,
    isCritical, setIsCritical,
    loading,
    errorMsg,
    pendingPhotos,
    uploadProgress,
    acceptedRodo, setAcceptedRodo,
    toastConfig, hideToast,
    submitLoading, submitProgress,
    handleSubmit, handleFilesSelected
  } = useOperatorForm({ machines, selectedMachine, setSelectedMachine, regions, handleStepChange, isOnline });"""
    
    content = content[:start_idx] + new_logic + content[end_idx:]
    
    with open('src/components/OperatorForm.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Refactored successfully")
else:
    print("Could not find boundaries")
