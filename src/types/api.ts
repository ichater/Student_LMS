export interface FieldError {
  field: string;
  message: string;
}

export interface ApiSuccess<T, C extends string = string> {
  success: true;
  code: C;
  message: string;
  data: T;
}

export interface ApiError<C extends string = string> {
  success: false;
  code: C;
  message: string;
  data: null;
  errors?: FieldError[];
}
