
// Declare global jsQR function
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number, options?: any) => { data: string; location: any } | null;
  }
}

export interface User {
  id: string;
  email: string;
  password: string; // In a real app, hash this!
  schoolName?: string;
}

export interface SchoolShift {
  id: string;
  name: string;      // e.g. "Morning Shift"
  startTime: string; // e.g. "07:00" (Entry Starts)
  lateTime: string;  // e.g. "08:00" (Late Cutoff)
}

export interface SchoolDetails {
  name: string;
  address: string;
  logoUrl?: string; // Optional URL or base64
  establishedYear?: string;
  shifts: SchoolShift[]; // Array of configured shifts
}

export interface ClassSection {
  id: string;
  grade: string; // e.g. "10", "12"
  section: string; // e.g. "A", "Science"
  medium?: string; // e.g. "English", "Hindi"
  classTeacherId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  contact: string;
  email: string;
  qualification: string;
  
  // New Fields
  experience: string; // e.g. "5 Years"
  joiningDate: string; // YYYY-MM-DD
  isClassTeacher: boolean;
  assignedClassId?: string; // ID of the class they manage

  avatarUrl: string;
  createdAt: number;
}

export interface Student {
  id: string;
  name: string;
  grNumber: string; // General Register Number
  rollNumber: string;
  grade: string; // This will now likely match a ClassSection
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  
  // Expanded Details
  parentName: string;
  parentContact: string;
  dob: string;
  bloodGroup: string;
  address: string;

  avatarUrl: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  personId: string; // Can be student or teacher
  type: 'STUDENT' | 'TEACHER';
  status: 'PRESENT' | 'LATE';
  shiftName?: string; // Track which shift they attended
  timestamp: number;
  date: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  CLASSES = 'CLASSES',
  SCHOOL_SETUP = 'SCHOOL_SETUP'
}
