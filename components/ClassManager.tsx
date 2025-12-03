
import React, { useState, useMemo } from 'react';
import { ClassSection } from '../types';
import { Plus, Trash2, Layers, Globe, GraduationCap } from 'lucide-react';

interface ClassManagerProps {
  classes: ClassSection[];
  onAddClass: (cls: ClassSection) => void;
  onDeleteClass: (id: string) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({ classes, onAddClass, onDeleteClass }) => {
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeMedium, setNewGradeMedium] = useState('English');
  const [addingSectionToGrade, setAddingSectionToGrade] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');

  // Group classes by grade
  const groupedClasses = useMemo(() => {
    const groups: Record<string, ClassSection[]> = {};
    classes.forEach(c => {
      if (!groups[c.grade]) groups[c.grade] = [];
      groups[c.grade].push(c);
    });
    // Sort grades roughly (numeric then string)
    return Object.entries(groups).sort((a, b) => {
        const numA = parseInt(a[0]);
        const numB = parseInt(b[0]);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a[0].localeCompare(b[0]);
    });
  }, [classes]);

  const handleAddGrade = () => {
    if (!newGradeName) return;
    // When adding a grade, we prompt for at least one section, defaulting to 'A' if they just want the grade structure
    onAddClass({
      id: crypto.randomUUID(),
      grade: newGradeName,
      section: 'A', // Default first section
      medium: newGradeMedium
    });
    setNewGradeName('');
    setNewGradeMedium('English');
  };

  const handleAddSection = (grade: string, existingMedium?: string) => {
    if (!newSectionName) return;
    onAddClass({
      id: crypto.randomUUID(),
      grade: grade,
      section: newSectionName,
      medium: existingMedium || 'English'
    });
    setNewSectionName('');
    setAddingSectionToGrade(null);
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Layers size={24} />
        </div>
        <div>
           <h2 className="text-3xl font-bold font-sans text-slate-900">Academic Structure</h2>
           <p className="text-slate-500 text-sm">Create grades and section divisions</p>
        </div>
      </div>

      {/* Add New Grade Block */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus size={16} /> Create New Grade / Class
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-[2]">
            <input 
              value={newGradeName}
              onChange={(e) => setNewGradeName(e.target.value)}
              placeholder="Class Name (e.g. 10, 12, KG2)"
              className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg outline-none focus:border-purple-500 font-bold text-slate-900"
            />
          </div>
          <div className="flex-1 relative">
             <select 
               value={newGradeMedium}
               onChange={(e) => setNewGradeMedium(e.target.value)}
               className="w-full h-full bg-slate-50 border border-slate-300 p-3 rounded-lg outline-none focus:border-purple-500 text-slate-900 appearance-none"
             >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Urdu">Urdu</option>
                <option value="State">State Language</option>
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Globe size={16} />
             </div>
          </div>
          <button 
            onClick={handleAddGrade}
            disabled={!newGradeName}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 font-bold"
          >
            Create
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Will create Grade with default section 'A'</p>
      </div>

      <div className="space-y-6">
        {groupedClasses.length === 0 && (
           <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
             No academic structure defined yet. Add a class above.
           </div>
        )}

        {groupedClasses.map(([grade, sections]) => {
          // Infer medium from the first section (assuming uniformity per grade for display)
          const displayMedium = sections[0]?.medium || 'English';
          
          return (
            <div key={grade} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
               <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-lg">
                       {grade}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                           Grade {grade}
                           <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded uppercase">{displayMedium}</span>
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{sections.length} Sections</p>
                     </div>
                  </div>
                  <button 
                     onClick={() => setAddingSectionToGrade(addingSectionToGrade === grade ? null : grade)}
                     className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center gap-1"
                  >
                     <Plus size={14} /> Add Section
                  </button>
               </div>
               
               {addingSectionToGrade === grade && (
                  <div className="p-3 bg-purple-50 border-b border-purple-100 flex gap-2 animate-in slide-in-from-top-2">
                     <input 
                        autoFocus
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="New Section (e.g. B, Science)"
                        className="flex-1 p-2 rounded border border-purple-200 text-sm outline-none focus:border-purple-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection(grade, displayMedium)}
                     />
                     <button 
                        onClick={() => handleAddSection(grade, displayMedium)}
                        className="bg-purple-600 text-white px-4 py-2 rounded text-xs font-bold"
                     >
                        Add
                     </button>
                  </div>
               )}

               <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sections.map(cls => (
                     <div key={cls.id} className="group flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                           <div>
                              <span className="font-bold text-slate-700 block leading-none">Sec {cls.section}</span>
                              <span className="text-[10px] text-slate-400">{cls.medium}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => onDeleteClass(cls.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 transition-all"
                          title="Delete Section"
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
