export interface ClassGroup {
  _id?: string;
  name: string;
  description?: string;
  academicYear?: string;
  homeroomTeacher?: any; // Teacher populated or ID
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  students?: any[]; // Populated students
}
