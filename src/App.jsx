import React from 'react';
import { useNotepad } from './hooks/useNotepad';
import MenuBar from './components/MenuBar';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import FindDialog from './components/dialogs/FindDialog';
import ReplaceDialog from './components/dialogs/ReplaceDialog';
import GoToLineDialog from './components/dialogs/GoToLineDialog';
import FontDialog from './components/dialogs/FontDialog';
import AboutDialog from './components/dialogs/AboutDialog';
import UnsavedChangesDialog from './components/dialogs/UnsavedChangesDialog';
import MessageDialog from './components/dialogs/MessageDialog';
import RecoveryDialog from './components/dialogs/RecoveryDialog';

export default function App() {
  const notepad = useNotepad();

  return (
    <div className="notepad-container">
      <MenuBar
        onAction={notepad.handleMenuAction}
        wordWrap={notepad.wordWrap}
        darkMode={notepad.darkMode}
        statusBarVisible={notepad.statusBarVisible}
      />
      <Editor
        editorRef={notepad.editorRef}
        wordWrap={notepad.wordWrap}
        onInput={notepad.handleEditorInput}
        onCursorMove={notepad.updateCursorPosition}
        onAction={notepad.handleMenuAction}
        onDrop={notepad.handleFileDrop}
      />
      {notepad.statusBarVisible && (
        <StatusBar
          line={notepad.cursorPosition.line}
          col={notepad.cursorPosition.col}
          encoding={notepad.encoding}
          lineEnding={notepad.lineEnding}
        />
      )}

      {notepad.activeDialog === 'find' && (
        <FindDialog
          onClose={() => notepad.setActiveDialog(null)}
          onFind={notepad.performFind}
          findState={notepad.findState}
          onFindStateChange={notepad.setFindState}
        />
      )}
      {notepad.activeDialog === 'replace' && (
        <ReplaceDialog
          onClose={() => notepad.setActiveDialog(null)}
          onFind={notepad.performFind}
          onReplace={notepad.performReplace}
          onReplaceAll={notepad.performReplaceAll}
          replaceState={notepad.replaceState}
          onReplaceStateChange={notepad.setReplaceState}
        />
      )}
      {notepad.activeDialog === 'goto' && (
        <GoToLineDialog
          onClose={() => notepad.setActiveDialog(null)}
          onGoTo={notepad.performGoTo}
        />
      )}
      {notepad.activeDialog === 'font' && (
        <FontDialog
          onClose={() => notepad.setActiveDialog(null)}
          onApply={notepad.applyFont}
          currentFont={notepad.currentFont}
        />
      )}
      {notepad.activeDialog === 'about' && (
        <AboutDialog onClose={() => notepad.setActiveDialog(null)} />
      )}
      {notepad.activeDialog === 'unsaved' && (
        <UnsavedChangesDialog
          filename={notepad.currentFilePath ? notepad.currentFilePath.split(/[\\/]/).pop() : 'Untitled'}
          onSave={() => notepad.resolveUnsaved(0)}
          onDontSave={() => notepad.resolveUnsaved(1)}
          onCancel={() => notepad.resolveUnsaved(2)}
        />
      )}
      {notepad.activeDialog === 'recovery' && notepad.recoveryData && (
        <RecoveryDialog
          timestamp={notepad.recoveryData.timestamp}
          filePath={notepad.recoveryData.originalPath}
          onRestore={() => notepad.resolveRecovery(true)}
          onDiscard={() => notepad.resolveRecovery(false)}
        />
      )}
      {notepad.messageDialog && (
        <MessageDialog
          title={notepad.messageDialog.title}
          message={notepad.messageDialog.message}
          onClose={notepad.closeMessage}
        />
      )}
    </div>
  );
}
