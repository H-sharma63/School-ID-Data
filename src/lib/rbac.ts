export type UserRole = "USER";

export const isAdmin = (role?: string): role is "ADMIN" => false;

export const canManageSchools = (role?: string) => true;
export const canPromoteStudents = (role?: string) => true;
export const canDeleteStudents = (role?: string) => true;
export const canBulkImport = (role?: string) => true;
export const canUploadForms = (role?: string) => true;
export const canDownloadExcel = (role?: string) => true;

export const getRoleBadge = (role?: string) => ({
  label: "User",
  className: "bg-primary/10 text-primary border-primary/20",
});