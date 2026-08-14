// ── Student Data Types ── //

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceMap {
  admissionNo: ConfidenceLevel;
  studentName: ConfidenceLevel;
  fatherName: ConfidenceLevel;
  motherName: ConfidenceLevel;
  dob: ConfidenceLevel;
  classSection: ConfidenceLevel;
  mobileNumber: ConfidenceLevel;
  address: ConfidenceLevel;
}

export interface Student {
  id: string;
  admissionNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string; // DD-MM-YYYY
  classSection: string; // e.g. "V-B", "X-C"
  mobileNumber: string; // comma-separated if 2 numbers
  address: string;
  confidence: ConfidenceMap;
  needsReview: boolean;
  createdAt: string; // ISO timestamp
}

export type QueueStatus = "pending" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  fileName: string;
  status: QueueStatus;
  thumbnail?: string;
  error?: string;
  result?: Student;
}

export type StudentField = keyof Pick<
  Student,
  | "admissionNo"
  | "studentName"
  | "fatherName"
  | "motherName"
  | "dob"
  | "classSection"
  | "mobileNumber"
  | "address"
>;

export const FIELD_LABELS: Record<StudentField, string> = {
  admissionNo: "Admission No.",
  studentName: "Student Name",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  dob: "Date of Birth",
  classSection: "Class & Section",
  mobileNumber: "Mobile Number",
  address: "Address",
};

export const FIELD_ORDER: StudentField[] = [
  "admissionNo",
  "studentName",
  "fatherName",
  "motherName",
  "dob",
  "classSection",
  "mobileNumber",
  "address",
];