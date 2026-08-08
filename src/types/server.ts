// ── Server-side types (database rows, API contracts) ── //

// Database row types (what comes from Turso SQLite)
export interface SchoolRow {
  id: string;
  name: string;
  address: string;
  contact: string;
  created_at: string;
  updated_at: string;
}

export interface SectionRow {
  id: string;
  school_id: string;
  class_name: string;
  section_name: string;
  academic_year: string;
  created_at: string;
}

export interface StudentRow {
  id: string;
  section_id: string;
  school_id: string;
  admission_no: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  class_name: string;
  section_name: string;
  mobile_number: string;
  address: string;
  academic_year: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface ExtractRequest {
  imageBase64: string; // Base64-encoded JPEG image
}

export interface ExtractResponse {
  success: boolean;
  data?: {
    admissionNo: string;
    studentName: string;
    fatherName: string;
    motherName: string;
    dob: string;
    classSection: string;
    mobileNumber: string;
    address: string;
  };
  confidence?: Record<string, "high" | "medium" | "low">;
  error?: string;
  suggestion?: string;
}

export interface ExportRequest {
  schoolId: string;
  className?: string;
  sectionName?: string;
  academicYear?: string;
  format: "csv" | "xlsx";
  fileName?: string;
}

export interface CreateSchoolRequest {
  name: string;
  address?: string;
  contact?: string;
}

export interface CreateSectionRequest {
  schoolId: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

export interface AddStudentRequest {
  sectionId: string;
  schoolId: string;
  admissionNo: string;
  studentName: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  className: string;
  sectionName: string;
  mobileNumber?: string;
  address?: string;
  academicYear: string;
}

export interface UpdateStudentRequest {
  id: string;
  admissionNo?: string;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  className?: string;
  sectionName?: string;
  mobileNumber?: string;
  address?: string;
}

export interface BulkPromoteRequest {
  schoolId: string;
  fromClass: string;
  toClass: string;
  fromAcademicYear: string;
  toAcademicYear: string;
}

export interface ImportExcelRequest {
  schoolId: string;
  className: string;
  sectionName: string;
  academicYear: string;
  // actual file handled via multipart/form-data
}