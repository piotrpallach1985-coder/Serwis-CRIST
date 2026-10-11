import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import PropTypes from 'prop-types';
import { useManagerStore } from '../../store/managerStore';
import DictationButton from '../shared/DictationButton';
import DTRChatModal from './DTRChatModal';
import { useState, useRef, useEffect } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateMachine } from "../../services/machines.service";
import { db, storage } from '../../firebase';

import { safe } from '../../utils/safeRender';
import { getCurrentTenant } from '../../utils/tenantHelper';


export default function MachineDTR({ machine, canManage, canDeleteNotes }) {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatDocument, setChatDocument] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [localDtrFiles, setLocalDtrFiles] = useState(machine.dtrFiles || []);
  const fileInputRef = useRef(null);
  const [newNote, setNewNote] = useState('');
  const [localNotes, setLocalNotes] = useState(machine.techNotes || []);
  const isMounted = useRef(true);
  const activeUploads = useRef([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      activeUploads.current.forEach(task => task.cancel());
    };
  }, []);

  useEffect(() => {
    setLocalDtrFiles(machine.dtrFiles || []);
    setLocalNotes(machine.techNotes || []);
  }, [machine.dtrFiles, machine.techNotes]);

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm(t('machines.dtr.confirmDeleteNote'))) return;
    try {
      const updatedNotes = localNotes.filter(n => n.id !== noteId);
      setLocalNotes(updatedNotes);
      await updateMachine(machine.id, {
        techNotes: updatedNotes
      });
    } catch (err) {
      console.error(err);
      alert(t('machines.dtr.deleteNoteError'));
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const noteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user?.name || t('machines.dtr.unknownUser')
      };
      const updatedNotes = [...localNotes, noteObj];
      setLocalNotes(updatedNotes);
      setNewNote('');
      await updateMachine(machine.id, {
        techNotes: updatedNotes
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(t('machines.dtr.addNoteError'));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canManage) return;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const uploadFile = (file) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg(t('machines.dtr.onlyPdfError'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg(t('machines.dtr.fileTooLargeError'));
      return;
    }
    if (localDtrFiles.length >= 10) {
      setErrorMsg(t('machines.dtr.maxFilesError'));
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMsg('');
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `tenants/${getCurrentTenant()}/machines/${machine.id}/dtr/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(p));
      }, 
      (error) => {
        console.error('Błąd uploadu:', error);
        setErrorMsg(t('machines.dtr.uploadError'));
        setUploading(false);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newFileObj = {
            id: fileName,
            name: file.name,
            url: downloadURL,
            path: uploadTask.snapshot.ref.fullPath,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };
          const updatedFiles = [...localDtrFiles, newFileObj];
          setLocalDtrFiles(updatedFiles);
          await updateMachine(machine.id, {
            dtrFiles: updatedFiles
          });
        } catch (err) {
          console.error(err);
          setErrorMsg(t('machines.dtr.dbSaveError'));
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    );
  };

  const handleDelete = async (fileObj) => {
    if (!window.confirm(t('machines.dtr.confirmDeleteFile', { name: fileObj.name }))) return;
    try {
      const storageRef = ref(storage, fileObj.path);
      await deleteObject(storageRef);
      const updatedFiles = localDtrFiles.filter(f => f.id !== fileObj.id);
      setLocalDtrFiles(updatedFiles);
      await updateMachine(machine.id, {
        dtrFiles: updatedFiles
      });
    } catch (err) {
      console.error(err);
      alert(t('machines.dtr.deleteFileError'));
    }
  };

  return (
    <ErrorBoundary>
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4 shrink-0"
         onDragOver={(e) => { e.preventDefault(); if (canManage) setIsDragOver(true); }}
         onDragLeave={() => setIsDragOver(false)}
         onDrop={handleDrop}
    >
      <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${isDragOver ? 'bg-blue-50 border-blue-200' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
          <div className="flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="ph ph-files text-xl text-blue-500"></i> {t('machines.dtr.title')}
            </h3>
            <span className="text-[10px] md:text-xs text-slate-500 mt-0.5">{t('machines.dtr.subtitle')}</span>
          </div>
          {localDtrFiles.length > 0 && (
            <button
              onClick={() => {
                setChatDocument(null);
                setIsChatOpen(true);
              }}
              className="mt-3 sm:mt-0 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm border border-blue-100 shrink-0"
            >
              <i className="ph ph-sparkle text-lg"></i>
              <span>{t('machines.dtr.chatWithDtr')}</span>
            </button>
          )}
        </div>
        {canManage ? (
          <div>
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            >
              <i className="ph ph-upload-simple"></i>
              {t('machines.buttons.uploadDtr')}
            </button>
          </div>
        ) : (
          <span className="text-xs italic text-gray-400">{t('machines.dtr.noPermissions')}</span>
        )}
      </div>
      
      <div className={`p-4 ${isDragOver ? 'bg-blue-50/30' : ''}`}>
        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">
            <i className="ph ph-warning-circle mr-2"></i> {errorMsg}
          </div>
        )}

        {uploading && (
          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between text-xs text-blue-800 font-bold mb-1">
              <span>{t('machines.dtr.uploadingFile')}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {localDtrFiles.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            {t('machines.dtr.noDtrFiles')}
            {canManage && <div className="text-xs mt-1">{t('machines.dtr.dragToUpload')}</div>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {localDtrFiles.map(f => (
              <div key={safe(f.id)} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all group">
                <a 
                  href={safe(f.url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 overflow-hidden flex-1"
                >
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                    <i className="ph ph-file-pdf text-2xl"></i>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-700 truncate">{safe(f.name)}</span>
                    <div className="text-[10px] text-gray-500 flex gap-2">
                      <span>{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{safe(new Date(f.uploadedAt).toLocaleDateString())}</span>
                    </div>
                  </div>
                </a>
                                <div className="flex items-center shrink-0">
                  {f.name && f.name.toLowerCase().endsWith('.pdf') && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChatDocument(f);
                        setIsChatOpen(true);
                      }}
                      title={t('machines.dtr.askAi')}
                      className="ml-2 w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <i className="ph ph-sparkle text-lg"></i>
                    </button>
                  )}
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(f)}
                      className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title={t('machines.buttons.deleteFile')}
                    >
                      <i className="ph ph-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      {/* NOTATKI DZIAŁU TECHNICZNEGO */}
      <div className="border-t border-slate-200 mt-2">
        <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="ph ph-notebook text-xl text-blue-600"></i> 
            {t('machines.dtr.techNotesTitle')}
          </h3>
        </div>
        <div className="p-2 sm:p-4">
          {canManage && (
            <div className="flex flex-col gap-2 mb-4">
              <div className="relative w-full">
                <textarea 
                  value={newNote} 
                  onChange={(e) => {
                    setNewNote(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }} 
                  placeholder={t("machines.dtr.addNotePlaceholder")} 
                  className="w-full border border-gray-300 rounded-lg p-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[60px]"
                  rows={2}
                />
                <div className="absolute right-2 bottom-3">
                  <DictationButton onResult={(text) => setNewNote(prev => prev ? prev + " " + text : text)} className="scale-75" />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors text-sm"
                >
                  {t("machines.buttons.add")}
                </button>
              </div>
            </div>
          )}

          {localNotes.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm italic">{t('machines.dtr.noTechNotes')}</div>
          ) : (
            <div className="space-y-3">
              {localNotes.map(n => (
                <div key={safe(n.id)} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">{safe(n.text)}</div>
                      <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                        {safe(n.createdBy)} &bull; {new Date(n.createdAt).toLocaleString('pl-PL')}
                      </div>
                    </div>
                    {canDeleteNotes && (
                      <button 
                        onClick={() => handleDeleteNote(n.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
                        title={t('machines.buttons.deleteNote')}
                      >
                        <i className="ph ph-trash"></i>
                      </button>
                    )}
                  </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
          <DTRChatModal 
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatDocument(null);
        }}
        document={chatDocument}
        allDocuments={localDtrFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'))}
        machineName={machine.name}
      />
    </ErrorBoundary>
  );
}

MachineDTR.propTypes = {
  machine: PropTypes.object.isRequired,
  canManage: PropTypes.bool,
  canDeleteNotes: PropTypes.bool,
};
