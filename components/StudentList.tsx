
import React, { useState, useRef, useMemo } from 'react';
import { Student, ClassSection } from '../types';
import { Plus, Trash2, Sparkles, QrCode, User, Phone, Home, Droplet, Calendar, Upload, Camera, FileText, Check, ArrowLeft, Users, ChevronRight, Hash } from 'lucide-react';
import { generateRandomStudents, extractStudentFromIDCard } from '../services/geminiService';

interface StudentListProps {
  students: Student[];
  classes: ClassSection[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewICard: (student: Student) => void;
}

type ViewState = 'CLASSES_GRID' | 'SECTION_DETAILS' | 'ADD_STUDENT' | 'BULK_ADD';

export const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddStudent, onDeleteStudent, onViewICard }) => {
  const [viewState, setViewState] = useState<ViewState>('CLASSES_GRID');
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  // Derived state based on active class
  const activeClass = classes.find(c => c.id === activeClassId);
  
  // Get students for class AND sort them by roll number line-wise (numerically)
  const classStudents = useMemo(() => {
     if (!activeClass) return [];
     const filtered = students.filter(s => s.grade === `Class ${activeClass.grade}` && s.section === activeClass.section);
     
     // Sort numerically/alphanumerically
     return filtered.sort((a, b) => {
        return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' });
     });
  }, [students, activeClass]);

  // Group classes for the grid view
  const groupedClasses = useMemo(() => {
    const groups: Record<string, ClassSection[]> = {};
    classes.forEach(c => {
      if (!groups[c.grade]) groups[c.grade] = [];
      groups[c.grade].push(c);
    });
    return Object.entries(groups).sort((a, b) => {
        const numA = parseInt(a[0]);
        const numB = parseInt(b[0]);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a[0].localeCompare(b[0]);
    });
  }, [classes]);
  
  // Add Form State
  const [loadingAI, setLoadingAI] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  
  const [name, setName] = useState('');
  const [grNumber, setGrNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string>('');

  const [bulkText, setBulkText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOcrProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const data = await extractStudentFromIDCard(base64);
        
        if (data) {
          if (data.name) setName(data.name);
          if (data.rollNumber) setRollNumber(data.rollNumber);
          if (data.grNumber) setGrNumber(data.grNumber);
          if (data.gender) setGender(data.gender as any);
          if (data.parentName) setParentName(data.parentName);
          if (data.parentContact) setParentContact(data.parentContact);
          if (data.dob) setDob(data.dob);
          if (data.bloodGroup) setBloodGroup(data.bloodGroup);
          if (data.address) setAddress(data.address);
        }
        setIsOcrProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualAdd = () => {
    if (!name || !rollNumber || !activeClass) return;

    const finalAvatar = avatarBase64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=64748b`;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name,
      grNumber: grNumber || 'N/A',
      rollNumber,
      gender,
      grade: `Class ${activeClass.grade}`,
      section: activeClass.section,
      parentName,
      parentContact,
      dob,
      bloodGroup,
      address,
      avatarUrl: finalAvatar,
      createdAt: Date.now(),
    };
    
    onAddStudent(newStudent);
    resetForm();
    setViewState('SECTION_DETAILS');
  };

  const handleBulkAdd = () => {
    if (!bulkText || !activeClass) return;

    const lines = bulkText.split('\n');
    let addedCount = 0;

    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
         // Expected format: Name, RollNo, GR No(Optional), Gender(Optional)
         const [bName, bRoll, bGR, bGender] = parts.map(p => p.trim());
         
         if (bName && bRoll) {
           const newStudent: Student = {
             id: crypto.randomUUID(),
             name: bName,
             grNumber: bGR || 'N/A',
             rollNumber: bRoll,
             gender: (bGender === 'Female' || bGender === 'F') ? 'Female' : 'Male',
             grade: `Class ${activeClass.grade}`,
             section: activeClass.section,
             parentName: '',
             parentContact: '',
             dob: '',
             bloodGroup: '',
             address: '',
             avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(bName)}&background=e2e8f0&color=64748b`,
             createdAt: Date.now()
           };
           onAddStudent(newStudent);
           addedCount++;
         }
      }
    });

    if (addedCount > 0) {
      setBulkText('');
      setViewState('SECTION_DETAILS');
    }
  };

  const resetForm = () => {
    setName('');
    setRollNumber('');
    setGrNumber('');
    setGender('Male');
    setParentName('');
    setParentContact('');
    setDob('');
    setBloodGroup('');
    setAddress('');
    setAvatarBase64('');
  };

  const handleAIAdd = async () => {
    setLoadingAI(true);
    const generated = await generateRandomStudents(1);
    setLoadingAI(false);
    
    if (generated && generated.length > 0) {
      const s = generated[0];
      setName(s.name || '');
      setRollNumber(s.rollNumber || '');
      setGrNumber(s.grNumber || '');
      if (s.gender) setGender(s.gender as any);
    }
  };

  // --- RENDER VIEWS ---

  // 1. CLASSES GRID VIEW
  if (viewState === 'CLASSES_GRID') {
     return (
        <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
           <div className="mb-8">
             <h2 className="text-4xl font-bold font-sans text-slate-900 mb-1">Students</h2>
             <p className="text-slate-500 font-mono text-sm">Select a class to view or add students</p>
           </div>

           <div className="space-y-6">
              {groupedClasses.length === 0 && (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                  No classes found. Please add classes in the "Manage Classes" tab first.
                </div>
              )}

              {groupedClasses.map(([grade, sections]) => {
                const displayMedium = sections[0]?.medium || 'English';
                return (
                  <div key={grade} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-brand-blue rounded-lg flex items-center justify-center font-bold text-lg">
                          {grade}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                             Grade {grade}
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-normal">{displayMedium}</span>
                          </h3>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {sections.map(cls => (
                           <button 
                             key={cls.id}
                             onClick={() => { setActiveClassId(cls.id); setViewState('SECTION_DETAILS'); }}
                             className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-brand-blue hover:shadow-md hover:bg-blue-50 transition-all group"
                           >
                              <div className="flex flex-col items-start">
                                <span className="font-bold text-slate-700 group-hover:text-brand-blue">Sec {cls.section}</span>
                                {cls.medium && cls.medium !== displayMedium && <span className="text-[10px] text-slate-400">{cls.medium}</span>}
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-blue" />
                           </button>
                        ))}
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
     );
  }

  // 2. SECTION DETAILS & LIST
  if (viewState === 'SECTION_DETAILS' && activeClass) {
     return (
        <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
           <div className="flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-800 transition-colors w-fit cursor-pointer" onClick={() => setViewState('CLASSES_GRID')}>
              <ArrowLeft size={18} />
              <span className="font-bold text-sm">Back to Classes</span>
           </div>

           <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold font-sans text-slate-900 mb-1">Grade {activeClass.grade} - {activeClass.section}</h2>
                <p className="text-slate-500 font-mono text-sm flex gap-2">
                   <span>{classStudents.length} Students</span>
                   <span className="text-slate-300">|</span>
                   <span>{activeClass.medium || 'English'} Medium</span>
                </p>
              </div>
              <button 
                 onClick={() => setViewState('ADD_STUDENT')}
                 className="bg-brand-blue text-white p-3 rounded-xl shadow-neo hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-bold text-sm px-4"
               >
                 <Plus size={18} /> Add Student
               </button>
           </div>

           <div className="space-y-3">
             {classStudents.length === 0 ? (
               <div className="text-center py-12 text-slate-400 font-mono border border-dashed border-slate-300 rounded-lg bg-white">
                 No students in this section yet.
               </div>
             ) : (
               classStudents.map(student => (
                 <div key={student.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-brand-blue hover:shadow-md transition-all">
                   <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-100 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 uppercase leading-none">Roll</span>
                      <span className="text-lg font-bold text-slate-900 leading-none">{student.rollNumber}</span>
                   </div>
                   <img src={student.avatarUrl} alt={student.name} className="w-10 h-10 rounded-full border border-slate-100 object-cover bg-slate-100" />
                   <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-slate-900 truncate">{student.name}</h3>
                     <p className="text-slate-500 text-xs font-mono uppercase flex items-center gap-3">
                        {student.grNumber && <span>GR: {student.grNumber}</span>}
                        {student.gender && <span className="bg-slate-100 px-1.5 rounded">{student.gender.charAt(0)}</span>}
                     </p>
                   </div>
                   <div className="flex gap-2">
                      <button 
                       onClick={() => onViewICard(student)}
                       className="p-2 text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                       title="View iCard"
                     >
                       <QrCode size={20} />
                     </button>
                     <button 
                       onClick={() => onDeleteStudent(student.id)}
                       className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <Trash2 size={20} />
                     </button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
     );
  }

  // 3. ADD STUDENT FORM (Specific to selected class)
  if (viewState === 'ADD_STUDENT' && activeClass) {
     return (
       <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
         <div className="flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-800 transition-colors w-fit cursor-pointer" onClick={() => setViewState('SECTION_DETAILS')}>
            <ArrowLeft size={18} />
            <span className="font-bold text-sm">Back to List</span>
         </div>
         
         <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-lg font-bold text-slate-800">New Admission</h3>
                 <p className="text-xs text-brand-blue font-bold uppercase mt-1">
                    Grade {activeClass.grade} - Section {activeClass.section} ({activeClass.medium})
                 </p>
              </div>
              
              <div className="flex gap-2">
                <input type="file" accept="image/*" ref={ocrInputRef} onChange={handleOcrUpload} className="hidden" />
                <button 
                  onClick={() => ocrInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center gap-2 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
                >
                   {isOcrProcessing ? 'Analyzing...' : <><Camera size={14} /> Auto-Fill</>}
                </button>
                
                <button onClick={() => setViewState('BULK_ADD')} className="text-xs font-bold text-slate-500 bg-slate-100 flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-slate-200">
                  <FileText size={14} /> Bulk
                </button>
              </div>
            </div>

            <div className="space-y-4">
               {/* Photo Upload */}
               <div className="flex justify-center mb-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-blue-50 transition-colors overflow-hidden"
                  >
                    {avatarBase64 ? (
                      <img src={avatarBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Photo</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
               </div>

              {/* Academic Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Info</p>
                   <button onClick={handleAIAdd} disabled={loadingAI} className="text-[10px] text-brand-blue font-bold flex items-center gap-1">
                     <Sparkles size={10} /> Generate Data
                   </button>
                </div>
                <input type="text" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} className="input-field" />
                <div className="flex gap-3">
                  <div className="flex-1 flex gap-2 items-center border-b border-slate-200">
                     <Hash size={16} className="text-slate-400" />
                     <input type="text" placeholder="GR No. *" value={grNumber} onChange={e => setGrNumber(e.target.value)} className="bg-transparent py-2 w-full outline-none text-sm" />
                  </div>
                  <input type="text" placeholder="Roll No. *" value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="input-field flex-1" />
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Details</p>
                
                {/* Gender Select */}
                <div className="flex items-center gap-3">
                   <User size={16} className="text-slate-400" />
                   <div className="flex gap-4">
                     {['Male', 'Female', 'Other'].map(g => (
                       <label key={g} className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="radio" 
                           name="gender" 
                           checked={gender === g} 
                           onChange={() => setGender(g as any)}
                           className="text-brand-blue focus:ring-brand-blue"
                         />
                         <span className="text-sm text-slate-700">{g}</span>
                       </label>
                     ))}
                   </div>
                </div>

                <div className="flex gap-3 items-center">
                  <User size={16} className="text-slate-400" />
                  <input type="text" placeholder="Parent/Guardian Name" value={parentName} onChange={e => setParentName(e.target.value)} className="input-field flex-1" />
                </div>

                <div className="flex gap-3 items-center">
                  <Phone size={16} className="text-slate-400" />
                  <input type="text" placeholder="Contact Number" value={parentContact} onChange={e => setParentContact(e.target.value)} className="input-field flex-1" />
                </div>

                <div className="flex gap-3">
                   <div className="flex-1 flex gap-2 items-center">
                      <Calendar size={16} className="text-slate-400" />
                      <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input-field w-full text-xs" />
                   </div>
                   <div className="w-1/3 flex gap-2 items-center">
                      <Droplet size={16} className="text-slate-400" />
                      <input type="text" placeholder="Blood Gp" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="input-field w-full" />
                   </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Home size={16} className="text-slate-400 mt-2" />
                  <textarea placeholder="Residential Address" value={address} onChange={e => setAddress(e.target.value)} className="input-field flex-1 h-20 resize-none" />
                </div>
              </div>

              <button 
                onClick={handleManualAdd}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-slate-800 text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <Check size={18} /> Confirm Admission
              </button>
            </div>
         </div>
       </div>
     );
  }

  // 4. BULK ADD VIEW
  if (viewState === 'BULK_ADD' && activeClass) {
     return (
       <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
         <div className="flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-800 transition-colors w-fit cursor-pointer" onClick={() => setViewState('ADD_STUDENT')}>
            <ArrowLeft size={18} />
            <span className="font-bold text-sm">Back to Form</span>
         </div>

         <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md animate-in fade-in slide-in-from-top-4">
             <h3 className="text-lg font-bold text-slate-800 mb-1">Bulk Import to {activeClass.grade}-{activeClass.section}</h3>
             <p className="text-xs text-slate-500 mb-4">Paste data in format: <span className="font-mono bg-slate-100 px-1">Name, RollNo, GR No, Gender(M/F)</span> (one per line)</p>
             
             <textarea 
               className="w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-sm focus:border-brand-blue outline-none"
               placeholder={`John Doe, 101, GR01, Male\nJane Smith, 102, GR02, Female`}
               value={bulkText}
               onChange={e => setBulkText(e.target.value)}
             />
             
             <div className="flex gap-3 mt-4">
               <button onClick={() => setViewState('ADD_STUDENT')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
               <button onClick={handleBulkAdd} className="flex-1 bg-brand-blue text-white font-bold py-3 rounded-lg shadow-lg">Import Students</button>
             </div>
          </div>
       </div>
     );
  }

  return null;
};
