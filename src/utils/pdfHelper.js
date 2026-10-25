export const savePdfWithPrompt = async (doc, defaultFilename) => {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultFilename,
        id: 'vexont-cmms-pdf-dir', // Tells the browser to remember the directory
        types: [{
          description: 'Plik PDF',
          accept: { 'application/pdf': ['.pdf'] }
        }]
      });
      const writable = await handle.createWritable();
      const blob = doc.output('blob');
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      if (err.name !== 'AbortError') {
        doc.save(defaultFilename);
      }
    }
  } else {
    doc.save(defaultFilename);
  }
};
