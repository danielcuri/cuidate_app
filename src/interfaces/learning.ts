
export interface CoursesAnswer {
    error: boolean;
    courses?: Course[];  
    course?: Course;
    certificates?:Certificate[];
    list_detail?:Complex[];   
    new_format?:SpecialFormat[];
}
export interface Certificate {
    course_id: number;
    name: string;      
    certificate: string;  
    date_finish: string;  
}
export interface SpecialFormat{
    title?:string;
    content?: Complex[]
}
export interface Complex {
    id: number;
    name: string;  
    duration: string;  
    flag_req: number;  
    flag_attempt: number;  
    register_type: number;  
    icon: number;   
    status: string;   
}
export interface Auxiliar{
    user: number;
    video: string;  
    time: number;
    lesson: number;
}
export interface Course {
    course_id: number;
    name: string;  
    area_name: string;  
    date_init: string;  
    date_end: string;  
    list_picture: string;  
    instructor_name: string;  
    status: number;  
    long_description: string;  
    qtyLessons: number;   
    totalTimeVideo?:string;
    totalTimeExam?:string;
    lessons?:Lesson[];
    exams?:Exam[];
    materials?:Material[];
    flag_survery?:number;
    certificate: string;  
    date_finish: string;  
}
export interface Material{
    id:number;
    course_id:number;
    name :string;
    material_template : string;   
}
export interface Lesson{
    id:number;
    course_id:number;
    sequence : number;
    long_description:string;
    name :string;
    video_link : string;
    video_duration:string;
    flag_req:number;
    flag_attempt : number;
}
export interface Exam{
    id:number;
    course_id:number;
    pass_grade : number;
    attempts : number;
    scholar_attempts:number;
    minutes:number;
    message:string;
    exam_duration :string;  
}
export interface Questions{
    id:number;
    required : number;
    exam_id:number;
    question : string;
    answers : string[];  
    convert_answers : string[];
    type:number;
}

export interface ExamAnswer {
    error: boolean;  
    msg? : string; 
    exam?: Exam;
    questions?: Questions[];   
}
export interface GeneralAnswer{
    error: boolean;   
    msg : string;
}
