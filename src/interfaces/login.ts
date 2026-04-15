export interface UserAnswer {
    error: boolean;
    msgs?: any[];
    msg?: string;
    user?: User;
}

export interface User {
    id?: number;
    name: string;
    email: string;
    dni: string;
    enterprise: Enterprise;
    roles: string[];
    pamolsa_projects: any;
    access_token: string;
    expires_at: string;
    /** Firma guardada en perfil (paridad Ionic `UserService.user.signature_url`). */
    signature_url?: string;
}

export interface Enterprise {
    id: number;
    name: string;
}
