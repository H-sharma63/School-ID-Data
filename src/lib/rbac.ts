export type UserRole = "ADMIN" | "TEACHER";

export const isAdmin = (role?: string): role is "ADMIN" => role === "ADMIN";

export const canManageSchools = (role?: string) => role === "ADMIN";
export const canPromoteStudents = (role?: string) => role === "ADMIN";
export const canDeleteStudents = (role?: string) => role === "ADMIN";
export const canBulkImport = (role?: string) => role === "ADMIN";
export const canUploadForms = (role?: string) => true;
export const canDownloadExcel = (role?: string) => true;

export const getRoleBadge = (role?: string) => ({
  label: role === "ADMIN" ? "Admin" : "Teacher",
  className: role === "ADMIN"
    ? "bg-warning/10 text-warning border-warning/20"
    : "bg-primary/10 text-primary border-primary/20",
});