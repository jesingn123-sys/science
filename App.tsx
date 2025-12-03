
import React, { useState, useEffect } from 'react';
import { AppView, Student, Teacher, ClassSection, SchoolDetails, AttendanceRecord, User } from './types';
import { Dashboard } from './components/Dashboard';
import { Scanner } from './components/Scanner';
import { StudentList } from './components/StudentList';
import { TeacherList } from './components/TeacherList';
import { ClassManager } from './components/ClassManager';
import { SchoolSetup } from './components/SchoolSetup';
import { ICard } from './components/ICard';
import { Auth } from './components/Auth';
import { LayoutDashboard, Users, ScanLine, GraduationCap, School, Menu } from 'lucide-react';

// Mock initial data
const MOCK_SCHOOL: SchoolDetails = {
  name: 'Riverdale High',
  address: '123 Riverdale Ln, New York',
  establishedYear: '1998',
  shifts: [
    { id: 's1', name: 'Morning Shift', startTime: '07:30', lateTime: '08:00' }
  ]
};

const MOCK_CLASSES: ClassSection[] = [
  { id: 'c1', grade: '10', section: 'A' },
  { id: 'c2', grade: '11', section: 'Science' },
  { id: 'c3', grade: '12', section: 'Commerce' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data State
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null); 
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>(MOCK_CLASSES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // UI State
  const [selectedPersonForCard, setSelectedPersonForCard] = useState<{person: Student | Teacher, type: 'STUDENT' | 'TEACHER'} | null>(null);
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const session = localStorage.getItem('vibecheck_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }

    const storedSchool = localStorage.getItem('vibecheck_school');
    const storedStudents = localStorage.getItem('vibecheck_students');
    const storedTeachers = localStorage.getItem('vibecheck_teachers');
    const storedClasses = localStorage.getItem('vibecheck_classes');
    const storedAttendance = localStorage.getItem('vibecheck_attendance');
    
    if (storedSchool) setSchoolDetails(JSON.parse(storedSchool));
    else setSchoolDetails(MOCK_SCHOOL); 

    if (storedStudents) setStudents(JSON.parse(storedStudents));
    if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
    if (storedClasses) setClasses(JSON.parse(storedClasses));
    if (storedAttendance) setAttendance(JSON.parse(storedAttendance));
  }, []);

  // Save to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vibecheck_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vibecheck_session');
    }

    if (schoolDetails) localStorage.setItem('vibecheck_school', JSON.stringify(schoolDetails));
    localStorage.setItem('vibecheck_students', JSON.stringify(students));
    localStorage.setItem('vibecheck_teachers', JSON.stringify(teachers));
    localStorage.setItem('vibecheck_classes', JSON.stringify(classes));
    localStorage.setItem('vibecheck_attendance', JSON.stringify(attendance));
  }, [schoolDetails, students, teachers, classes, attendance, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.schoolName && (!schoolDetails || schoolDetails.name === 'Riverdale High')) {
       // If user provided school name during signup, preset it
       setSchoolDetails(prev => prev ? { ...prev, name: user.schoolName! } : { ...MOCK_SCHOOL, name: user.schoolName! });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: Adjust pitch/rate to sound younger/cooler
      utterance.rate = 1.1; 
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleScan = (data: string) => {
    // Check if it is a student
    const student = students.find(s => s.id === data);
    const teacher = teachers.find(t => t.id === data);
    const person = student || teacher;
    const type = student ? 'STUDENT' : (teacher ? 'TEACHER' : null);

    if (person && type) {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already present
      const alreadyPresent = attendance.some(r => r.personId === person.id && r.date === today);
      
      if (alreadyPresent) {
        setScanMessage({ text: `${person.name} is already present!`, type: 'error' });
        speak(`Already scanned, ${person.name}`);
      } else {
        // Calculate Status (Present or Late) based on Shifts
        let status: 'PRESENT' | 'LATE' = 'PRESENT';
        let matchedShiftName = 'Regular';

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        if (schoolDetails?.shifts && schoolDetails.shifts.length > 0) {
           // Find the closest shift logic
           // We assume the shift is relevant if we are scanning within 2 hours before start or anytime after
           // For simplicity, we compare with the "Late Time" of each shift. 
           // If we are before or slightly after a shift's late time, it's that shift.
           
           // Sort shifts by start time
           const sortedShifts = [...schoolDetails.shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
           
           // Find the active shift
           let activeShift = sortedShifts[0]; // Default to first
           
           // If we have multiple shifts, try to find the one closest to now
           let minDiff = Infinity;
           
           for (const shift of sortedShifts) {
              const [h, m] = shift.startTime.split(':').map(Number);
              const shiftStartMinutes = h * 60 + m;
              const diff = Math.abs(currentTimeMinutes - shiftStartMinutes);
              if (diff < minDiff) {
                 minDiff = diff;
                 activeShift = shift;
              }
           }

           matchedShiftName = activeShift.name;

           // Parse Late Time
           const [lh, lm] = activeShift.lateTime.split(':').map(Number);
           const lateTimeMinutes = lh * 60 + lm;

           // Check Late Status
           if (currentTimeMinutes > lateTimeMinutes) {
              status = 'LATE';
           }
        }

        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          personId: person.id,
          type: type as any,
          status,
          shiftName: matchedShiftName,
          timestamp: Date.now(),
          date: today
        };
        setAttendance(prev => [...prev, newRecord]);
        
        const isLate = status === 'LATE';
        setScanMessage({ 
          text: isLate 
            ? `⚠️ Marked LATE (${matchedShiftName}): ${person.name}` 
            : `✅ Marked PRESENT (${matchedShiftName}): ${person.name}`, 
          type: isLate ? 'warning' : 'success' 
        });

        // Voice Feedback
        if (isLate) {
          speak(`Late entry, ${person.name}`);
        } else {
          speak(`Welcome, ${person.name}`);
        }
      }
    } else {
      setScanMessage({ text: "Unknown ID Card", type: 'error' });
      speak("Unknown ID");
    }

    // Clear message after 2 seconds
    setTimeout(() => {
      setScanMessage(null);
    }, 2000);
  };

  // --- Handlers ---

  const handleSaveSchool = (details: SchoolDetails) => {
    setSchoolDetails(details);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleAddStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    setSelectedPersonForCard({ person: student, type: 'STUDENT' });
  };

  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers(prev => [...prev, teacher]);
    setSelectedPersonForCard({ person: teacher, type: 'TEACHER' });
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
  };

  const handleAddClass = (cls: ClassSection) => {
    setClasses(prev => [...prev, cls]);
  };

  // --- Render ---

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  // Force setup if no school name (unless we are on the setup page)
  if (!schoolDetails && currentView !== AppView.SCHOOL_SETUP) {
    return <SchoolSetup currentDetails={null} onSave={handleSaveSchool} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-blue selection:text-white pb-20">
      
      {/* Top Header Mobile Menu */}
      {currentView !== AppView.SCANNER && (
        <div className="fixed top-0 right-0 p-4 z-40">
           <div className="relative">
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white rounded-full shadow-md text-slate-600 hover:bg-slate-50 transition-colors">
               <Menu size={20} />
             </button>
             {isMenuOpen && (
               <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-48 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                 <button onClick={() => { setCurrentView(AppView.SCHOOL_SETUP); setIsMenuOpen(false); }} className="px-4 py-3 hover:bg-slate-50 text-left text-sm font-bold text-slate-700 flex items-center gap-2">
                   <School size={16} /> School Profile
                 </button>
                 <button onClick={() => { setCurrentView(AppView.CLASSES); setIsMenuOpen(false); }} className="px-4 py-3 hover:bg-slate-50 text-left text-sm font-bold text-slate-700 flex items-center gap-2">
                   <Users size={16} /> Manage Classes
                 </button>
               </div>
             )}
           </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-screen w-full pt-6">
        {currentView === AppView.SCHOOL_SETUP && (
          <SchoolSetup 
            currentDetails={schoolDetails} 
            onSave={handleSaveSchool} 
            onLogout={handleLogout}
          />
        )}
        
        {currentView === AppView.DASHBOARD && (
          <Dashboard 
            students={students} 
            teachers={teachers}
            classes={classes}
            attendance={attendance} 
            schoolDetails={schoolDetails}
            onNavigate={setCurrentView}
          />
        )}
        
        {currentView === AppView.STUDENTS && (
          <StudentList 
            students={students} 
            classes={classes}
            onAddStudent={handleAddStudent} 
            onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))}
            onViewICard={(s) => setSelectedPersonForCard({ person: s, type: 'STUDENT' })}
          />
        )}

        {currentView === AppView.TEACHERS && (
          <TeacherList 
            teachers={teachers} 
            classes={classes}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={(id) => setTeachers(prev => prev.filter(t => t.id !== id))}
            onViewICard={(t) => setSelectedPersonForCard({ person: t, type: 'TEACHER' })}
          />
        )}

        {currentView === AppView.CLASSES && (
          <ClassManager 
            classes={classes}
            onAddClass={handleAddClass}
            onDeleteClass={(id) => setClasses(prev => prev.filter(c => c.id !== id))}
          />
        )}

        {currentView === AppView.SCANNER && (
           <Scanner onScan={handleScan} onClose={() => setCurrentView(AppView.DASHBOARD)} />
        )}
      </main>

      {/* ICard Modal */}
      {selectedPersonForCard && (
        <ICard 
          person={selectedPersonForCard.person}
          type={selectedPersonForCard.type}
          schoolDetails={schoolDetails}
          onClose={() => setSelectedPersonForCard(null)} 
        />
      )}

      {/* Toast */}
      {scanMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-4 border-2 font-bold shadow-2xl animate-in slide-in-from-top-4 w-max max-w-[90vw] text-center rounded-xl backdrop-blur-md
          ${scanMessage.type === 'success' ? 'bg-green-500/90 text-white border-green-600' : ''}
          ${scanMessage.type === 'warning' ? 'bg-yellow-400/90 text-yellow-900 border-yellow-500' : ''}
          ${scanMessage.type === 'error' ? 'bg-red-500/90 text-white border-red-600' : ''}`}
        >
          <span className="text-lg">{scanMessage.text}</span>
        </div>
      )}

      {/* Navigation */}
      {currentView !== AppView.SCANNER && currentView !== AppView.SCHOOL_SETUP && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 max-w-2xl mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.DASHBOARD ? 'text-brand-blue' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={24} />
          </button>

          <button 
            onClick={() => setCurrentView(AppView.STUDENTS)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.STUDENTS ? 'text-brand-blue' : 'text-slate-400'}`}
          >
            <Users size={24} />
          </button>

          {/* Center Scan Button */}
          <button 
            onClick={() => setCurrentView(AppView.SCANNER)}
            className="relative -top-8 bg-brand-blue text-white p-4 rounded-full border-[6px] border-slate-50 shadow-xl hover:scale-105 hover:bg-brand-dark transition-all"
          >
            <ScanLine size={28} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => setCurrentView(AppView.TEACHERS)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.TEACHERS ? 'text-orange-500' : 'text-slate-400'}`}
          >
            <GraduationCap size={26} />
          </button>

          <button 
             onClick={() => setCurrentView(AppView.CLASSES)}
             className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.CLASSES ? 'text-purple-600' : 'text-slate-400'}`}
           >
             <School size={24} />
           </button>
        </nav>
      )}
    </div>
  );
};

export default App;
