import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Editor, { OnMount } from '@monaco-editor/react';

// --- Types ---

interface ITemplateBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'footer';
  content: Record<string, any>;
  styles?: Record<string, string>;
}

interface IVariable {
  label: string;
  name: string;
  value?: string;
}

// --- UI Components ---

const SortableItem: React.FC<{ block: ITemplateBlock; onSelect: (id: string) => void }> = ({ block, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 mb-2 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md cursor-pointer flex justify-between items-center group"
      onClick={() => onSelect(block.id)}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400 uppercase text-xs font-bold tracking-wider">{block.type}</span>
        <span className="text-sm text-gray-700 truncate max-w-[200px]">
          {JSON.stringify(block.content).substring(0, 30)}...
        </span>
      </div>
      <div
        className="cursor-grab text-gray-300 group-hover:text-gray-500"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </div>
    </div>
  );
};

const VariableInjector: React.FC<{ variables: IVariable[]; onInject: (variableName: string) => void }> = ({ variables, onInject }) => (
  <div className="p-4 bg-gray-50 border-l border-gray-200">
    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Available Variables</h4>
    <div className="flex flex-wrap gap-2">
      {variables.map((v) => (
        <button
          key={v.name}
          onClick={() => onInject(`{{${v.name}}}`)}
          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100 hover:bg-blue-100 transition"
        >
          {v.label}
        </button>
      ))}
    </div>
  </div>
);

// --- Main Builder Component ---

export const VisualTemplateBuilder: React.FC = () => {
  const [mode, setMode] = useState<'visual' | 'json'>('visual');
  const [blocks, setBlocks] = useState<ITemplateBlock[]>([
    { id: '1', type: 'header', content: { text: 'Welcome to Novu' } },
    { id: '2', type: 'text', content: { text: 'Your verification code is {{code}}' } },
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState<string>(JSON.stringify(blocks, null, 2));
  const [isGenerating, setIsGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleMode = (newMode: 'visual' | 'json') => {
    if (newMode === 'json') {
      setJsonContent(JSON.stringify(blocks, null, 2));
    } else {
      try {
        const parsed = JSON.parse(jsonContent);
        setBlocks(parsed);
      } catch (e) {
        alert('Invalid JSON format');
        return;
      }
    }
    setMode(newMode);
  };

  const handleEditorChange = (value: string | undefined) => {
    setJsonContent(value || '');
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setBlocks(prev => [...prev, {
        id: Date.now().toString(),
        type: 'text',
        content: { text: 'AI Generated: Your order has shipped!' }
      }]);
      setIsGenerating(false);
    }, 1000);
  };

  const mockVariables: IVariable[] = [
    { label: 'User Name', name: 'userName' },
    { label: 'Verification Code', name: 'code' },
    { label: 'Organization', name: 'orgName' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar / Block Palette */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Template Builder</div>
        <div className="p-4 overflow-y-auto flex-1">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Blocks</div>
          <div className="space-y-2">
             {['Header', 'Text', 'Image', 'Button'].map(type => (
               <button key={type} className="w-full text-left px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                 + {type}
               </button>
             ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isGenerating ? 'Generating...' : '✨ Generate Content'}
            </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded">
            <button
              onClick={() => toggleMode('visual')}
              className={`px-3 py-1 text-sm rounded ${mode === 'visual' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              Visual
            </button>
            <button
              onClick={() => toggleMode('json')}
              className={`px-3 py-1 text-sm rounded ${mode === 'json' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              JSON
            </button>
          </div>
          <button className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700">
            Save Changes
          </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
            {mode === 'visual' ? (
              <div className="max-w-2xl mx-auto">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-800">Email Preview</h2>
                    <span className="text-xs text-gray-500">Drag blocks to reorder</span>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                        {blocks.map((block) => (
                            <SortableItem key={block.id} block={block} onSelect={setSelectedBlockId} />
                        ))}
                    </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-light"
                  value={jsonContent}
                  onChange={handleEditorChange}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
            )}
        </div>
      </div>

      {/* Right Panel: Variables & Properties */}
      <div className="w-72 bg-white border-l border-gray-200">
        <VariableInjector variables={mockVariables} onInject={(val) => console.log('Injecting', val)} />
      </div>
    </div>
  );
};

export default VisualTemplateBuilder;
