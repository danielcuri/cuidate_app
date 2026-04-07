export interface UserAnswer {
    error: boolean;
    user?: User;
    msg?: any;
    msgs?: any;
}

export interface User {
    id: number;
    name: string;
    email: string;
    dni: string;
    roles?: string[];
    signature_url: string;
}