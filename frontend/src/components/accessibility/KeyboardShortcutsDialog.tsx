import React from 'react';
import Modal from '@/components/ui/Modal';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  // Selection
  { keys: ['V'], description: 'Select tool', category: 'Selection' },
  { keys: ['A'], description: 'Select all modules', category: 'Selection' },
  { keys: ['Esc'], description: 'Deselect all', category: 'Selection' },
  
  // Tools
  { keys: ['H'], description: 'Pan tool', category: 'Tools' },
  { keys: ['R'], description: 'Rotate tool', category: 'Tools' },
  { keys: ['S'], description: 'Scale tool', category: 'Tools' },
  
  // Editing
  { keys: ['Delete'], description: 'Delete selected modules', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete selected modules', category: 'Editing' },
  { keys: ['Ctrl', 'C'], description: 'Copy selected modules', category: 'Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste modules', category: 'Editing' },
  { keys: ['Ctrl', 'X'], description: 'Cut selected modules', category: 'Editing' },
  { keys: ['Ctrl', 'D'], description: 'Duplicate selected modules', category: 'Editing' },
  
  // History
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'History' },
  { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'History' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', category: 'History' },
  
  // View
  { keys: ['G'], description: 'Toggle grid', category: 'View' },
  { keys: ['+'], description: 'Zoom in', category: 'View' },
  { keys: ['-'], description: 'Zoom out', category: 'View' },
  
  // File
  { keys: ['Ctrl', 'S'], description: 'Save map', category: 'File' },
  
  // Help
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
  { keys: ['F1'], description: 'Show keyboard shortcuts', category: 'Help' },
];

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose }) => {
  // Define category order for better organization
  const categoryOrder = ['Selection', 'Tools', 'Editing', 'History', 'View', 'File', 'Help'];
  const categories = categoryOrder.filter(cat => 
    shortcuts.some(s => s.category === cat)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
      ariaLabel="Map editor keyboard shortcuts reference"
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              {category}
            </h3>
            <div className="space-y-1">
              {shortcuts
                .filter(s => s.category === category)
                .map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm min-w-8 text-center">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 text-xs font-medium">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong className="font-semibold">Tip:</strong> Press{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-white border border-blue-200 rounded shadow-sm">
            ?
          </kbd>{' '}
          or{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-white border border-blue-200 rounded shadow-sm">
            F1
          </kbd>{' '}
          anytime to view this dialog.
        </p>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsDialog;
