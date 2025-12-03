
import React, { useState } from 'react';
import { SchoolDetails, SchoolShift } from '../types';
import { School, Save, MapPin, Calendar, Image as ImageIcon, Clock, LogOut, Plus, Trash2 } from 'lucide-react';

interface SchoolSetupProps {
  currentDetails: SchoolDetails | null;
  onSave: (details: SchoolDetails) => void;
  onLogout?: () => void;
}

export const SchoolSetup: React.FC<SchoolSetupProps> = ({ currentDetails, onSave, onLogout }) => {
  const [name, setName] = useState(currentDetails?.name || '');
  const [address, setAddress] = useState(currentDetails?.address || '');
  const [est, setEst] = useState(currentDetails?.establishedYear || '');
  const [logo, setLogo] = useState(currentDetails?.logoUrl || '');
  
  // Shift State
  const [shifts, setShifts] = useState<SchoolShift[]>(currentDetails?.shifts && currentDetails.shifts.length > 0 
    ? currentDetails.shifts 
    : [{ id: '1', name: 'Morning Shift', startTime: '07:30', lateTime: '08:00' }]
  );

  const handleAddShift = () => {
    if (shifts.length >= 2) return;
    setShifts([...shifts, { 
      id: crypto.randomUUID(), 
      name: 'Afternoon Shift', 
      startTime: '12:00', 
      lateTime: '12:30' 
    }]);
  };

  const handleRemoveShift = (id: string) => {
    if (shifts.length <= 1) return;
    setShifts(shifts.filter(s => s.id !== id));
  };

  const updateShift = (id: string, field: keyof SchoolShift, value: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    if (!name) return;
    onSave({
      name,
      address,
      establishedYear: est,
      logoUrl: logo,
      shifts: shifts
    });
  };

  return (
    <div className="p-6 max-w-lg mx-auto w-full pb-24 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4 text-brand-blue shadow-neo-sm">
          <School size={40} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">School Profile</h1>
        <p className="text-slate-500">Configure your institution's identity</p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Basic Details */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">School Name</label>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 p-3 rounded-lg focus-within:border-brand-blue transition-colors">
            <School size={20} className="text-slate-400" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Springfield High School"
              className="bg-transparent w-full outline-none text-slate-900 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Address / Location</label>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 p-3 rounded-lg focus-within:border-brand-blue transition-colors">
            <MapPin size={20} className="text-slate-400" />
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Education Lane, NY"
              className="bg-transparent w-full outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Est. Year</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 p-3 rounded-lg focus-within:border-brand-blue transition-colors">
              <Calendar size={20} className="text-slate-400" />
              <input 
                type="text" 
                value={est}
                onChange={(e) => setEst(e.target.value)}
                placeholder="1995"
                className="bg-transparent w-full outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 p-3 rounded-lg focus-within:border-brand-blue transition-colors">
              <ImageIcon size={20} className="text-slate-400" />
              <input 
                type="text" 
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://..."
                className="bg-transparent w-full outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Shifts Configuration */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock size={18} className="text-orange-500" />
               School Shifts
             </h3>
             {shifts.length < 2 && (
               <button 
                 onClick={handleAddShift}
                 className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-slate-700"
               >
                 <Plus size={12} /> Add Shift
               </button>
             )}
          </div>
          
          <div className="space-y-4">
             {shifts.map((shift, index) => (
               <div key={shift.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                  {shifts.length > 1 && (
                    <button 
                      onClick={() => handleRemoveShift(shift.id)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="mb-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Shift Name</label>
                    <input 
                      type="text" 
                      value={shift.name}
                      onChange={(e) => updateShift(shift.id, 'name', e.target.value)}
                      className="w-full bg-transparent border-b border-slate-200 focus:border-brand-blue outline-none text-sm font-bold text-slate-800 py-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] uppercase font-bold text-slate-400">On-Time Start</label>
                       <input 
                         type="time" 
                         value={shift.startTime}
                         onChange={(e) => updateShift(shift.id, 'startTime', e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded p-1 text-sm font-mono outline-none focus:border-brand-blue"
                       />
                     </div>
                     <div>
                       <label className="text-[10px] uppercase font-bold text-slate-400">Late After</label>
                       <input 
                         type="time" 
                         value={shift.lateTime}
                         onChange={(e) => updateShift(shift.id, 'lateTime', e.target.value)}
                         className="w-full bg-white border border-slate-200 rounded p-1 text-sm font-mono outline-none focus:border-brand-blue"
                       />
                     </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 italic">
                     Students scanning between {shift.startTime} and {shift.lateTime} are "On Time". After {shift.lateTime} is "Late".
                  </div>
               </div>
             ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={!name}
          className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>

      {onLogout && (
        <button 
          onClick={onLogout}
          className="w-full mt-6 bg-red-50 text-red-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
        >
          <LogOut size={20} />
          Log Out
        </button>
      )}
    </div>
  );
};
