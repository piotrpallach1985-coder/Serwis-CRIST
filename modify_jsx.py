import os
import re

files_to_modify = [
    'src/components/manager/Machines.jsx',
    'src/components/manager/MachineTable.jsx',
    'src/components/manager/MachineFilters.jsx',
    'src/components/manager/MachineForm.jsx',
    'src/components/manager/MachineDetails.jsx',
    'src/components/manager/MachineCard.jsx',
    'src/components/manager/MachineDTR.jsx'
]

def add_use_translation(content, component_name):
    if "import { useTranslation }" not in content:
        import_stmt = "import { useTranslation } from 'react-i18next';\n"
        content = import_stmt + content
    
    if "const { t } = useTranslation();" not in content:
        pattern = rf"(export default function {component_name}\([^)]*\)\s*{{)"
        content = re.sub(pattern, r"\1\n  const { t } = useTranslation();\n", content)
    
    return content

replacements = {
    'Machines.jsx': {
        "alert('Nie znaleziono zeskanowanej maszyny w bazie tej firmy.');": "alert(t('machines.alerts.notFoundScanned'));",
        "'Potwierdź usunięcie maszyny'": "t('machines.alerts.confirmDeleteTitle')",
        "`Czy na pewno chcesz usunąć maszynę \"${name}\"? Tej operacji nie można cofnąć (maszyna zostanie oznaczona jako usunięta).`": "t('machines.alerts.confirmDeleteMessage', { name: name })",
        "'Usuń maszynę'": "t('machines.alerts.deleteMachine')",
        "'Automatyczne zamknięcie'": "t('machines.history.autoClose')",
        "'Maszyna została usunięta'": "t('machines.history.machineDeleted')",
        "'System'": "t('machines.history.system')",
        "'Maszyna i powiązane zadania zostały zarchiwizowane'": "t('machines.toasts.machineArchived')",
        "'Błąd: ' +": "t('machines.toasts.error') +",
        "'Maszyna zweryfikowana.'": "t('machines.toasts.machineVerified')",
        "Drukuj QR - ${name}": "${t('machines.print.printQr')}${name}",
        "Data: ${": "${t('machines.print.date')}${",
        "'Brak danych'": "t('machines.print.noData')",
        "'Skopiowano ID maszyny do schowka (NFC)'": "t('machines.toasts.copiedNfc')",
        "'Błąd kopiowania do schowka'": "t('machines.toasts.copyNfcError')",
        "'Wygenerowano nowy kod QR'": "t('machines.toasts.newQrGenerated')",
        "'Błąd generowania kodu QR'": "t('machines.toasts.newQrError')",
        "'Błąd odczytu QR: brak danych.'": "t('machines.toasts.qrReadError')",
        "'Wczytano maszyne: ' +": "t('machines.toasts.machineLoaded') +",
        "'Nie znaleziono maszyny: ' +": "t('machines.toasts.machineNotFound') +",
        "title=\"Skanuj kod QR (Baza Urzadzen)\"": "title={t('machines.scanner.qrTitle')}",
        "subtitle=\"Skieruj aparat na kod QR maszyny, aby otworzyć jej detale.\"": "subtitle={t('machines.scanner.qrSubtitle')}",
        "title=\"Odczyt NFC (Baza Urządzeń)\"": "title={t('machines.scanner.nfcTitle')}",
        " Skanuj\n": " {t('machines.buttons.scan')}\n",
        " NFC\n": " {t('machines.buttons.nfc')}\n",
        " Excel\n": " {t('machines.buttons.excel')}\n"
    },
    'MachineTable.jsx': {
        "'Nazwa Maszyny'": "t('machines.table.machineName')",
        "'Nr wew. / Opis'": "t('machines.table.internalId')",
        "'Rejon / Hala'": "t('machines.table.region')",
        "'Akcje'": "t('machines.table.actions')",
        "title=\"Kopiuj ID NFC\"": "title={t('machines.table.copyNfc')}",
        "Szczegóły <i": "{t('machines.table.details')} <i",
        "emptyMessage=\"Brak maszyn spełniających kryteria.\"": "emptyMessage={t('machines.table.empty')}"
    },
    'MachineFilters.jsx': {
        "Baza Maszyn": "{t('machines.filters.title')}",
        "Zarządzaj parkiem maszynowym i przeglądaj historię serwisów": "{t('machines.filters.subtitle')}",
        "Dodaj Maszynę": "{t('machines.buttons.addMachine')}",
        "placeholder=\"Szukaj (nazwa, nr wew)...\"": "placeholder={t('machines.filters.searchPlaceholder')}",
        "Wszystkie Rejony": "{t('machines.filters.allRegions')}",
        "Bez rejonu": "{t('machines.filters.noRegion')}"
    },
    'MachineForm.jsx': {
        "'Osiągnięto limit maszyn ('": "t('machines.form.limitReached')",
        "'Zaktualizowano maszynę'": "t('machines.toasts.machineUpdated')",
        "'Maszyna została dodana pomyślnie.'": "t('machines.toasts.machineAdded')",
        "'Wystąpił błąd: ' +": "t('machines.toasts.error') +",
        "'Edytuj maszynę' : 'Dodaj nową maszynę i wygeneruj kod QR'": "t('machines.form.editMachine') : t('machines.form.addMachine')",
        "Nazwa maszyny *": "{t('machines.form.machineName')}",
        "placeholder=\"np. Suwnica S-01\"": "placeholder={t('machines.form.machineNamePlaceholder')}",
        "Rejon / Numer Hali *": "{t('machines.form.region')}",
        "-- Wybierz Rejon --": "{t('machines.form.selectRegion')}",
        "Przelot / Info": "{t('machines.form.bay')}",
        "placeholder=\"np. Przelot 2 / Magazyn\"": "placeholder={t('machines.form.bayPlaceholder')}",
        "Numer wew. UR": "{t('machines.form.internalIdLabel')}",
        "placeholder=\"np. UR-123\"": "placeholder={t('machines.form.internalIdPlaceholder')}",
        "Maszyna nadrzędna (Opcjonalnie)": "{t('machines.form.parentMachine')}",
        "Brak (Główna maszyna)": "{t('machines.form.noParent')}",
        "Dodatkowy opis awaryjny (Opcjonalnie)": "{t('machines.form.additionalDescription')}",
        "placeholder=\"Opis pomocniczy widoczny dla pracowników...\"": "placeholder={t('machines.form.additionalDescriptionPlaceholder')}",
        "Ten opis będzie widoczny pod nazwą maszyny, może pomóc w dokładniejszej identyfikacji.": "{t('machines.form.additionalDescriptionHint')}",
        "Uwaga dotycząca kodów QR": "{t('machines.form.qrWarningTitle')}",
        "Jeśli zmieniasz nazwę maszyny, stary, wydrukowany kod QR (naklejka) będzie miał nieaktualny napis. Pamiętaj, aby po zapisaniu zmian wygenerować i wydrukować ": "{t('machines.form.qrWarningText')}",
        "nowy kod QR": "{t('machines.form.newQr')}",
        "Anuluj\n": "{t('machines.buttons.cancel')}\n",
        "'Zapisz zmiany' : 'Dodaj maszynę'": "t('machines.buttons.saveChanges') : t('machines.buttons.addMachineBtn')"
    },
    'MachineDetails.jsx': {
        "'Nieznany rejon'": "t('machines.details.unknownRegion')",
        "Powrót</span>": "{t('machines.buttons.back')}</span>",
        "Szczegóły Maszyny": "{t('machines.details.title')}",
        "Skanuj QR</span>": "{t('machines.buttons.scanQr')}</span>",
        "title=\"Skanuj kod QR maszyny\"": "title={t('machines.buttons.scanQrTitle')}",
        "title=\"Odczytaj NFC maszyny\"": "title={t('machines.buttons.nfcTitle')}",
        "NFC</span>": "{t('machines.buttons.nfc')}</span>",
        "title=\"Edytuj\"": "title={t('machines.buttons.edit')}",
        "Edytuj</span>": "{t('machines.buttons.edit')}</span>",
        "title=\"Usuń\"": "title={t('machines.buttons.delete')}",
        "Usuń</span>": "{t('machines.buttons.delete')}</span>",
        "title=\"Drukuj QR\"": "title={t('machines.buttons.printQr')}",
        "Drukuj QR</span>": "{t('machines.buttons.printQr')}</span>",
        "title=\"Raport PDF\"": "title={t('machines.buttons.pdfReport')}",
        "Raport PDF</span>": "{t('machines.buttons.pdfReport')}</span>",
        "Podzespół urządzenia: ": "{t('machines.details.parentMachine')}",
        "ID: {machine.id}": "{t('machines.details.id')}{machine.id}",
        "Rejon / Miejsce": "{t('machines.details.regionLabel')}",
        "Podmapa\n": "{t('machines.details.submap')}\n",
        "Numer Wewnętrzny": "{t('machines.details.internalIdLabel')}",
        "Stan Licznika": "{t('machines.details.workHoursLabel')}",
        " RBG": " {t('machines.details.rbg')}",
        "title=\"Aktualizuj RBG\"": "title={t('machines.details.updateRbg')}",
        "Ost. akt: ": "{t('machines.details.lastUpdate')}",
        "Dodatkowy Opis": "{t('machines.details.additionalDescriptionLabel')}",
        "Koszt Części (TCO)": "{t('machines.details.partsCostLabel')}",
        " PLN": " {t('machines.details.pln')}",
        "Podzespoły (Drzewo aktywów)": "{t('machines.details.childMachinesTitle')}",
        " Dodaj\n": " {t('machines.buttons.add')}\n",
        "Brak przypisanych podzespołów.": "{t('machines.details.noChildMachines')}",
        "Części zamienne (BOM)": "{t('machines.details.bomTitle')}",
        "Stan: ": "{t('machines.details.stock')}",
        "szt.'": "pcs.'",
        "Maszyna Wymaga Weryfikacji": "{t('machines.details.needsVerification')}",
        "Aby wygenerować kod QR dla operatorów, użyj przycisku <b>Edytuj</b>, uzupełnij brakujące dane (np. lokalizację, numer wewnętrzny), usuń dopisek \"(DO WERYFIKACJI)\" z nazwy i zapisz.": "{t('machines.details.verificationHint')}",
        "Kod QR Maszyny": "{t('machines.details.qrCodeTitle')}",
        "Data kodu (ost. edycja): ": "{t('machines.details.qrDate')}",
        "Operatorzy mogą zeskanować ten kod, aby szybko zgłosić awarię tej maszyny.": "{t('machines.details.qrHint')}",
        "Ładowanie historii z bazy...": "{t('machines.details.loadingHistory')}",
        "Historia Awarii": "{t('machines.details.breakdownHistory')}",
        " zgłoszeń": " {t('machines.details.ticketsCount')}",
        "title=\"Brak awarii\"": "title={t('machines.details.noBreakdowns')}",
        "message=\"Nie odnotowano żadnych zgłoszeń awarii dla tej maszyny.\"": "message={t('machines.details.noBreakdownsMsg')}",
        "'Inne'": "t('machines.details.other')",
        "'Zamknięte' : 'Otwarte'": "t('machines.details.closed') : t('machines.details.open')",
        "Zgłaszający: <span": "{t('machines.details.reportedBy')}<span",
        "Historia Serwisów": "{t('machines.details.serviceHistory')}",
        " serwisów": " {t('machines.details.servicesCount')}",
        "title=\"Brak serwisów\"": "title={t('machines.details.noServices')}",
        "message=\"Nie zaplanowano jeszcze żadnych przeglądów dla tej maszyny.\"": "message={t('machines.details.noServicesMsg')}",
        "'Zakończony' : 'W trakcie/Oczekujący'": "t('machines.details.completed') : t('machines.details.pending')",
        "'Czasowy'": "t('machines.details.calendar')",
        "'Mieszany'": "t('machines.details.mixed')",
        "'Planowane: '": "t('machines.details.plannedDate')",
        "Zużyte Części Zapasowe": "{t('machines.details.usedPartsTitle')}",
        "title=\"Brak części\"": "title={t('machines.details.noParts')}",
        "message=\"Nie wydano jeszcze żadnych części dla tej maszyny.\"": "message={t('machines.details.noPartsMsg')}",
        "'Nieznana część'": "t('machines.details.unknownPart')",
        "Ilość: <span": "{t('machines.details.quantity')}<span"
    },
    'MachineCard.jsx': {
        "WERYFIKACJA": "{t('machines.card.verification')}",
        "ID: {machine.id}": "{t('machines.card.id')}{machine.id}",
        "Nr wew: {machine.internalId || '-'}": "{t('machines.card.internalId')}{machine.internalId || '-'}",
        " Rejon: {regions.find": " {t('machines.card.region')}{regions.find",
        " Hala/Przelot: {machine.bay || '-'}": " {t('machines.card.bay')}{machine.bay || '-'}",
        " RBG: {machine.currentWorkHours || 0}": " {t('machines.card.rbg')}{machine.currentWorkHours || 0}",
        " Kopiuj ID NFC\n": " {t('machines.card.copyNfc')}\n"
    },
    'MachineDTR.jsx': {
        "\"Czy na pewno chcesz usunąć tę notatkę?\"": "t('machines.dtr.confirmDeleteNote')",
        "'Błąd podczas usuwania notatki'": "t('machines.dtr.deleteNoteError')",
        "'Nieznany'": "t('machines.dtr.unknownUser')",
        "'Błąd podczas dodawania notatki.'": "t('machines.dtr.addNoteError')",
        "'Tylko pliki PDF są obsługiwane.'": "t('machines.dtr.onlyPdfError')",
        "'Plik jest za duży. Maksymalny rozmiar to 50MB.'": "t('machines.dtr.fileTooLargeError')",
        "'Możesz dodać maksymalnie 10 plików DTR do maszyny.'": "t('machines.dtr.maxFilesError')",
        "'Błąd podczas wgrywania pliku.'": "t('machines.dtr.uploadError')",
        "'Błąd zapisu w bazie danych.'": "t('machines.dtr.dbSaveError')",
        "`Czy na pewno chcesz usunąć plik ${fileObj.name}?`": "t('machines.dtr.confirmDeleteFile', { name: fileObj.name })",
        "'Nie udało się usunąć pliku.'": "t('machines.dtr.deleteFileError')",
        "Dokumentacja DTR": "{t('machines.dtr.title')}",
        "Tylko PDF. Max 50MB. Limit: 10 plików. Powyżej 30MB może działać wolniej. Przeciągnij i puść.": "{t('machines.dtr.subtitle')}",
        "Czatuj z całą DTR": "{t('machines.dtr.chatWithDtr')}",
        "Wgraj DTR\n": "{t('machines.buttons.uploadDtr')}\n",
        "Brak uprawnień do edycji DTR": "{t('machines.dtr.noPermissions')}",
        "Wgrywanie pliku...": "{t('machines.dtr.uploadingFile')}",
        "Brak wgranych plików DTR dla tej maszyny.": "{t('machines.dtr.noDtrFiles')}",
        "Przeciągnij plik PDF tutaj, aby go wgrać.": "{t('machines.dtr.dragToUpload')}",
        "title=\"Zapytaj AI o ten plik\"": "title={t('machines.dtr.askAi')}",
        "title=\"Usuń plik\"": "title={t('machines.buttons.deleteFile')}",
        "Notatki Działu Technicznego": "{t('machines.dtr.techNotesTitle')}",
        "placeholder=\"Dodaj nową notatkę...\"": "placeholder={t('machines.dtr.addNotePlaceholder')}",
        "Dodaj\n": "{t('machines.buttons.add')}\n",
        "Brak notatek technicznych.": "{t('machines.dtr.noTechNotes')}",
        "title=\"Usuń notatkę\"": "title={t('machines.buttons.deleteNote')}"
    }
}

for file_path in files_to_modify:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    file_name = os.path.basename(file_path)
    component_name = file_name.split('.')[0]
    
    # Do replacements
    if file_name in replacements:
        for old, new in replacements[file_name].items():
            content = content.replace(old, new)
            
    # Add useTranslation
    content = add_use_translation(content, component_name)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Modification complete.")
