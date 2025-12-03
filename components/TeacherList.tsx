
import React, { useState } from 'react';
import { Teacher, ClassSection } from '../types';
import { Plus, Trash2, QrCode, GraduationCap, Calendar, Briefcase, BookOpen, UserCheck, Edit, Check } from 'lucide-react';

interface TeacherListProps {
  teachers: Teacher[];
  classes?: ClassSection[]; // Optional for now to not break if not passed, but we'll use it
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher?: (teacher: Teacher) => void; // Support editing
  onDeleteTeacher: (id: string) => void;
  onViewICard: (teacher: Teacher) => void;
}

export const TeacherList: React.FC<TeacherListProps> = ({ 
  teachers, 
  classes = [], 
  onAddTeacher, 
  onUpdateTeacher,
  onDeleteTeacher, 
  onViewICard 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [qualification, setQualification] = useState('');
  
  // New Fields
  const [experience, setExperience] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [assignedClassId, setAssignedClassId] = useState('');

  const resetForm = () => {
    setName('');
    setSubject('');
    setContact('');
    setEmail('');
    setQualification('');
    setExperience('');
    setJoiningDate('');
    setIsClassTeacher(false);
    setAssignedClassId('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (t: Teacher) => {
    setName(t.name);
    setSubject(t.subject);
    setContact(t.contact);
    setEmail(t.email);
    setQualification(t.qualification);
    setExperience(t.experience || '');
    setJoiningDate(t.joiningDate || '');
    setIsClassTeacher(t.isClassTeacher || false);
    setAssignedClassId(t.assignedClassId || '');
    
    setEditingId(t.id);
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (!name || !subject) return;
    
    const teacherData: Teacher = {
      id: editingId || crypto.randomUUID(),
      name,
      subject,
      contact,
      email,
      qualification,
      experience,
      joiningDate,
      isClassTeacher,
      assignedClassId: isClassTeacher ? assignedClassId : undefined,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=fff`,
      createdAt: editingId ? (teachers.find(t => t.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };
    
    if (editingId && onUpdateTeacher) {
      onUpdateTeacher(teacherData);
    } else {
      onAddTeacher(teacherData);
    }
    
    resetForm();
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-bold font-sans text-slate-900 mb-1">Faculty</h2>
          <p className="text-slate-500 font-mono text-sm">Total Teachers: {teachers.length}</p>
        </div>
        <button 
          onClick={() => {
            if (isEditing) resetForm();
            else setIsEditing(true);
          }}
          className={`text-white p-3 rounded-xl shadow-lg hover:translate-y-1 hover:shadow-md transition-all ${isEditing ? 'bg-slate-500' : 'bg-orange-500'}`}
        >
          {isEditing ? <Check size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-md animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-orange-500" />
            {editingId ? 'Edit Faculty Member' : 'New Faculty Admission'}
          </h3>
          
          <div className="space-y-4">
             {/* Basic Info */}
             <div className="space-y-3">
               <input type="text" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} className="input-field font-bold" />
               <input type="text" placeholder="Subject / Department *" value={subject} onChange={e => setSubject(e.target.value)} className="input-field" />
             </div>

             {/* Professional Details */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Info</p>
               <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                     <Briefcase size={16} className="text-slate-400" />
                     <input type="text" placeholder="Experience (e.g. 5 Years)" value={experience} onChange={e => setExperience(e.target.value)} className="input-field text-sm" />
                  </div>
                  <div className="flex items-center gap-2">
                     <Calendar size={16} className="text-slate-400" />
                     <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} className="input-field text-sm" />
                  </div>
               </div>
               <input type="text" placeholder="Qualification (e.g. M.Sc, B.Ed)" value={qualification} onChange={e => setQualification(e.target.value)} className="input-field" />
             </div>

             {/* Class Teacher Role */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
               <div className="flex items-center gap-2 mb-2">
                 <input 
                   type="checkbox" 
                   id="isClassTeacher" 
                   checked={isClassTeacher} 
                   onChange={e => setIsClassTeacher(e.target.checked)}
                   className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                 />
                 <label htmlFor="isClassTeacher" className="text-sm font-bold text-slate-700 cursor-pointer">Assign as Class Teacher?</label>
               </div>
               
               {isClassTeacher && (
                 <select 
                   value={assignedClassId} 
                   onChange={e => setAssignedClassId(e.target.value)} 
                   className="input-field bg-white"
                 >
                   <option value="">Select Class to Manage...</option>
                   {classes.map(c => (
                     <option key={c.id} value={c.id}>Grade {c.grade} - Section {c.section}</option>
                   ))}
                 </select>
               )}
             </div>

             {/* Contact */}
             <div className="grid grid-cols-2 gap-3">
               <input type="text" placeholder="Contact No" value={contact} onChange={e => setContact(e.target.value)} className="input-field" />
               <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
             </div>
             
             <button 
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg uppercase tracking-wider hover:bg-slate-800 text-sm mt-2 shadow-lg"
              >
                {editingId ? 'Update Profile' : 'Save & Generate ID'}
              </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {teachers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono border border-dashed border-slate-300 rounded-lg bg-white">
            No teachers registered.
          </div>
        ) : (
          teachers.map(teacher => {
             const managedClass = classes.find(c => c.id === teacher.assignedClassId);
             
             return (
              <div key={teacher.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500 hover:shadow-md transition-all">
                <img src={teacher.avatarUrl} alt={teacher.name} className="w-12 h-12 rounded-full border border-slate-100 object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{teacher.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold">{teacher.subject}</span>
                    {teacher.isClassTeacher && managedClass && (
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1">
                        <UserCheck size={10} /> Class {managedClass.grade}-{managedClass.section}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(teacher)}
                    className="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => onViewICard(teacher)}
                    className="p-2 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    title="View ID Card"
                  >
                    <QrCode size={20} />
                  </button>
                  <button 
                    onClick={() => onDeleteTeacher(teacher.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
             );
          })
        )}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 0.75rem;
          border-radius: 0.5rem;
          color: #0f172a;
          outline: none;
        }
        .input-field:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 1px #f97316;
        }
      `}</style>
    </div>
  );
};
