export type PageBE<T> = {
    content: T[];
    size: number;
    number: number;
    last: boolean;
};

export type Slice<T> = {
    content: T[];
    number: number;
    size: number;
    last: boolean;
};

export type ApiResponse<T> = {
    code: number;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
};