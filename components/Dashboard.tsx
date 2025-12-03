
import React, { useState, useMemo } from 'react';
import { Student, Teacher, AttendanceRecord, ClassSection, SchoolDetails } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { CheckCircle2, XCircle, Users, GraduationCap, School, Settings, ChevronRight, Clock, Hash, TrendingUp, AlertCircle, BarChart3, List } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassSection[];
  attendance: AttendanceRecord[];
  schoolDetails: SchoolDetails | null;
  onNavigate?: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, teachers, classes, attendance, schoolDetails, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'ANALYTICS'>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<'PRESENT' | 'ABSENT' | 'LATE'>('PRESENT');

  // Common Date Calculation
  const today = new Date().toISOString().split('T')[0];
  
  // Overview Data
  const todaysRecords = attendance.filter(r => r.date === today && r.type === 'STUDENT');
  const presentRecords = todaysRecords.filter(r => r.status === 'PRESENT');
  const lateRecords = todaysRecords.filter(r => r.status === 'LATE');
  
  const presentIds = new Set(presentRecords.map(r => r.personId));
  const lateIds = new Set(lateRecords.map(r => r.personId));
  const allAttendedIds = new Set([...presentIds, ...lateIds]);

  const presentStudents = students.filter(s => presentIds.has(s.id));
  const lateStudents = students.filter(s => lateIds.has(s.id));
  const absentStudents = students.filter(s => !allAttendedIds.has(s.id));
  const absentCount = students.length - allAttendedIds.size;

  // --- ANALYTICS CALCULATIONS ---

  // 1. Class Performance (Today)
  const classPerformanceData = useMemo(() => {
    return classes.map(cls => {
       const studentsInClass = students.filter(s => s.grade === `Class ${cls.grade}` && s.section === cls.section);
       const totalStudents = studentsInClass.length;
       if (totalStudents === 0) return null;

       const presentCount = studentsInClass.filter(s => allAttendedIds.has(s.id)).length;
       const percentage = Math.round((presentCount / totalStudents) * 100);

       return {
         name: `${cls.grade}-${cls.section}`,
         percentage: percentage,
         present: presentCount,
         total: totalStudents
       };
    }).filter(Boolean).sort((a, b) => (b?.percentage || 0) - (a?.percentage || 0));
  }, [classes, students, allAttendedIds]);

  // 2. Individual Insights (Historical)
  const studentInsights = useMemo(() => {
      // Determine total school days tracked in the system
      const uniqueDates = new Set(attendance.map(r => r.date));
      const totalDays = uniqueDates.size || 1;

      const insights = students.map(s => {
         const records = attendance.filter(r => r.personId === s.id);
         const lateCount = records.filter(r => r.status === 'LATE').length;
         const presentCount = records.length; // Including late
         const absentCount = totalDays - presentCount; // Rough estimate based on system usage

         return {
           student: s,
           lateCount,
           absentCount,
           attendanceRate: Math.round((presentCount / totalDays) * 100)
         };
      });

      // Top Latecomers
      const topLate = [...insights].sort((a, b) => b.lateCount - a.lateCount).slice(0, 5).filter(i => i.lateCount > 0);
      
      // Top Absentees (Ghost Mode) - those with high absence count
      const topAbsent = [...insights].sort((a, b) => b.absentCount - a.absentCount).slice(0, 5).filter(i => i.absentCount > 0);

      // Never Attended
      const neverAttended = insights.filter(i => i.attendanceRate === 0).map(i => i.student);

      return { topLate, topAbsent, neverAttended };
  }, [students, attendance]);


  // Chart Data for Overview
  const getOverviewChartData = () => {
    const data = [];
    const studentCount = students.length || 1;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const daysRecords = attendance.filter(r => r.date === dateStr && r.type === 'STUDENT');
      const p = daysRecords.filter(r => r.status === 'PRESENT').length;
      const l = daysRecords.filter(r => r.status === 'LATE').length;
      const totalRecorded = p + l;
      const a = Math.max(0, studentCount - totalRecorded);

      data.push({ name: dayName, Present: p, Late: l, Absent: a });
    }
    return data;
  };

  const overviewChartData = getOverviewChartData();

  const renderStudentList = (list: Student[], statusType: 'PRESENT' | 'LATE' | 'ABSENT') => {
    if (list.length === 0) {
      return <div className="text-slate-400 italic text-center py-8 bg-white rounded-lg border border-dashed border-slate-300">No students in this category.</div>;
    }
    return list.map(student => {
      const record = attendance.find(r => r.personId === student.id && r.date === today);
      const classInfo = student.grade.replace('Class ', '');
      
      return (
        <div key={student.id} className={`flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm border-l-4 
            ${statusType === 'PRESENT' ? 'border-l-brand-blue' : ''}
            ${statusType === 'LATE' ? 'border-l-yellow-400' : ''}
            ${statusType === 'ABSENT' ? 'border-l-red-500 opacity-75' : ''}
        `}>
          <div className="flex items-center gap-3">
            <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
            <div>
              <div className="text-slate-900 font-bold text-sm">{student.name}</div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                    <Hash size={10} /> {classInfo} - {student.section}
                 </span>
                 <span className="text-slate-400 text-xs font-mono">• {student.rollNumber}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
             {statusType === 'PRESENT' && <span className="text-brand-blue font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">ON TIME</span>}
             {statusType === 'LATE' && <span className="text-yellow-700 font-bold text-xs bg-yellow-100 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={12} /> LATE</span>}
             {statusType === 'ABSENT' && <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">ABSENT</span>}
             {record && (
                <div className="flex flex-col items-end mt-1">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={10} />
                    <span className="text-xs font-mono font-bold">{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {schoolDetails && schoolDetails.shifts && schoolDetails.shifts.length > 1 && record.shiftName && (
                     <span className="text-[10px] text-slate-400 uppercase">{record.shiftName}</span>
                  )}
                </div>
             )}
          </div>
        </div>
      );
    });
  };

  const primaryShift = schoolDetails?.shifts?.[0];
  const startTimeDisplay = primaryShift ? primaryShift.startTime : "08:00";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto w-full animate-in fade-in">
      <div className="flex justify-between items-start mb-6">
        <div className="cursor-pointer group" onClick={() => onNavigate && onNavigate(AppView.SCHOOL_SETUP)}>
           <h1 className="text-2xl font-bold font-sans text-slate-900 tracking-tight leading-none group-hover:text-brand-blue transition-colors flex items-center gap-2">
             {schoolDetails?.name || "My School"}
             <Settings size={16} className="text-slate-300 group-hover:text-brand-blue" />
           </h1>
           <p className="text-xs text-slate-500 font-mono mt-1">
             {schoolDetails?.shifts && schoolDetails.shifts.length > 1 ? "Multi-Shift System Active" : `Start Time: ${startTimeDisplay}`}
           </p>
        </div>
        <div className="bg-brand-light text-brand-blue px-3 py-1 rounded-full text-xs font-bold font-mono">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short'})}
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex p-1 bg-slate-200 rounded-xl mb-6 shadow-inner">
         <button 
           onClick={() => setViewMode('OVERVIEW')} 
           className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'OVERVIEW' ? 'bg-white shadow text-brand-blue' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <List size={16} /> Overview
         </button>
         <button 
           onClick={() => setViewMode('ANALYTICS')} 
           className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'ANALYTICS' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
         >
           <BarChart3 size={16} /> Analytics
         </button>
      </div>
      
      {/* ---------------- OVERVIEW MODE ---------------- */}
      {viewMode === 'OVERVIEW' && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors">
                 <div className="bg-blue-50 text-blue-600 p-2 rounded-full mb-1"><Users size={16} /></div>
                 <span className="text-lg font-bold text-slate-800">{students.length}</span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider">Students</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-200 transition-colors">
                 <div className="bg-orange-50 text-orange-600 p-2 rounded-full mb-1"><GraduationCap size={16} /></div>
                 <span className="text-lg font-bold text-slate-800">{teachers.length}</span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider">Teachers</span>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors">
                 <div className="bg-purple-50 text-purple-600 p-2 rounded-full mb-1"><School size={16} /></div>
                 <span className="text-lg font-bold text-slate-800">{classes.length}</span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider">Classes</span>
              </div>
          </div>

          {/* Main Attendance Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-brand-blue border border-brand-dark p-4 rounded-xl shadow-neo relative overflow-hidden text-white hover:scale-[1.02] transition-transform">
               <div className="absolute top-0 right-0 p-3 opacity-20"><CheckCircle2 size={48} /></div>
              <p className="text-blue-100 font-mono text-xs uppercase tracking-wider font-bold">Present Today</p>
              <div className="flex items-end gap-2 mt-1">
                 <p className="text-3xl font-bold">{presentIds.size + lateIds.size}</p>
                 {lateIds.size > 0 && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 rounded font-bold mb-1">{lateIds.size} Late</span>}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] transition-transform">
              <div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider font-bold">Absent</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{absentCount}</p>
              </div>
            </div>
          </div>

          {/* Chart - Weekly Breakdown */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mb-8 h-80">
            <h3 className="text-slate-800 font-bold font-sans text-sm mb-4">Weekly Attendance Report</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overviewChartData} stackOffset="sign">
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} cursor={{fill: '#f1f5f9'}} />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                <Bar dataKey="Present" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} barSize={28} />
                <Bar dataKey="Late" stackId="a" fill="#facc15" radius={[0,0,0,0]} barSize={28} />
                <Bar dataKey="Absent" stackId="a" fill="#ef4444" radius={[4,4,0,0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lists Section */}
          <div className="mb-8">
            <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('PRESENT')} className={`flex-1 py-2 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${activeTab === 'PRESENT' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>On Time ({presentStudents.length})</button>
              <button onClick={() => setActiveTab('LATE')} className={`flex-1 py-2 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${activeTab === 'LATE' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Late ({lateStudents.length})</button>
              <button onClick={() => setActiveTab('ABSENT')} className={`flex-1 py-2 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 ${activeTab === 'ABSENT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Absent ({absentStudents.length})</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activeTab === 'PRESENT' && renderStudentList(presentStudents, 'PRESENT')}
              {activeTab === 'LATE' && renderStudentList(lateStudents, 'LATE')}
              {activeTab === 'ABSENT' && renderStudentList(absentStudents, 'ABSENT')}
            </div>
          </div>
        </>
      )}

      {/* ---------------- ANALYTICS MODE ---------------- */}
      {viewMode === 'ANALYTICS' && (
        <div className="space-y-6">
           {/* Section 1: Class Leaderboard */}
           <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h3 className="text-slate-800 font-bold font-sans text-lg mb-4 flex items-center gap-2">
                 <TrendingUp size={20} className="text-brand-blue" /> Class Attendance Today
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={classPerformanceData} layout="vertical" margin={{ left: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={50} fontSize={12} stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{fontSize: '12px'}} />
                      <Bar dataKey="percentage" name="Attendance %" radius={[0, 4, 4, 0]} barSize={20}>
                        {classPerformanceData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry && entry.percentage > 90 ? '#22c55e' : (entry && entry.percentage > 70 ? '#3b82f6' : '#ef4444')} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                 {classPerformanceData.slice(0, 3).map((item, i) => item && (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                       <span className="text-slate-600 font-mono">#{i+1} Class {item.name}</span>
                       <span className="font-bold">{item.percentage}% <span className="text-slate-400 font-normal">({item.present}/{item.total})</span></span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Section 2: Individual Insights Grid */}
           <div className="grid grid-cols-1 gap-6">
              
              {/* Latecomers */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm border-l-4 border-l-yellow-400">
                 <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-600" /> "The Late Squad"
                 </h3>
                 {studentInsights.topLate.length > 0 ? (
                    <div className="space-y-3">
                       {studentInsights.topLate.map((item) => (
                          <div key={item.student.id} className="flex justify-between items-center bg-yellow-50 p-2 rounded-lg">
                             <div className="flex items-center gap-2">
                                <img src={item.student.avatarUrl} className="w-8 h-8 rounded-full" />
                                <div>
                                   <div className="text-sm font-bold text-slate-900">{item.student.name}</div>
                                   <div className="text-[10px] text-slate-500">{item.student.grade}-{item.student.section}</div>
                                </div>
                             </div>
                             <div className="text-xs font-bold bg-white px-2 py-1 rounded border border-yellow-200 text-yellow-700">
                                {item.lateCount} Times
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <p className="text-slate-400 text-sm italic">Everyone is punctual! 🎉</p>
                 )}
              </div>

              {/* Absenteeism */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm border-l-4 border-l-red-500">
                 <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" /> Chronic Absence
                 </h3>
                 {studentInsights.topAbsent.length > 0 ? (
                    <div className="space-y-3">
                       {studentInsights.topAbsent.map((item) => (
                          <div key={item.student.id} className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                             <div className="flex items-center gap-2">
                                <img src={item.student.avatarUrl} className="w-8 h-8 rounded-full" />
                                <div>
                                   <div className="text-sm font-bold text-slate-900">{item.student.name}</div>
                                   <div className="text-[10px] text-slate-500">{item.student.grade}-{item.student.section}</div>
                                </div>
                             </div>
                             <div className="text-xs font-bold bg-white px-2 py-1 rounded border border-red-200 text-red-700">
                                {item.absentCount} Days
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <p className="text-slate-400 text-sm italic">Attendance is 100%! 🌟</p>
                 )}
              </div>
              
              {/* Never Attended */}
              {studentInsights.neverAttended.length > 0 && (
                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
                   <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-slate-400">Never Scanned In</h3>
                   <div className="flex flex-wrap gap-2">
                      {studentInsights.neverAttended.slice(0, 10).map(s => (
                         <span key={s.id} className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{s.name}</span>
                      ))}
                      {studentInsights.neverAttended.length > 10 && <span className="text-xs text-slate-500 self-center">+{studentInsights.neverAttended.length - 10} more</span>}
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
