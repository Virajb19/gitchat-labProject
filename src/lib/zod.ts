import {z} from 'zod'

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
const githubRepoUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/
const githubAccessToken = /^[a-zA-Z0-9_-]{40}$/

export const SignUpSchema = z.object({
    username: z.string().min(3, {message: 'username must be atleast 3 letters long'}).max(10, {message: 'username cannot be more than 10 letters'}).trim(),
    email: z.string().email({message: 'Please enter a valid email'}).trim(),
    password: z.string().min(8, {message: 'Password must be atleast 8 letters long'}).max(15)
              .regex(passwordRegex, {message: 'Password must contain atleast one special char and one number'}).trim()
})  

export const SignInSchema = z.object({
    email: z.string().email({message: 'Please enter a valid email'}).trim(),
    password: z.string().min(8, {message: 'Password must be atleast 8 letters long'}).max(15, { message: 'Password cannot exceed 15 characters'})
              .regex(passwordRegex, {message: 'Password must contain atleast one special char and one number'}).trim()
})

export const createProjectSchema = z.object({
    name: z.string().min(1, {message: 'Provide a project name'}).max(25, { message: 'Project name cannot exceed 15 letters'}).trim(),
    repoURL: z.string().regex(githubRepoUrl, { message: 'Provide a valid repo URL'}).trim(),
    githubToken: z.string().regex(githubAccessToken, { message: 'Provide a valid access token'}).trim().optional()
})

export const askQuestionSchema = z.object({
    question: z.string().trim().min(1, { message: 'Ask a question !'}).max(500).or(z.literal(''))
})

export const createMeetingSchema = z.object({
    name: z.string().max(500),
    url: z.string().url()
})

export const processMeetingSchema = z.object({
    fileUrl: z.string(),
    projectId: z.string(),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Provide a valid email!'}).trim()
})

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, {message: 'Password must be atleast 8 letters long'}).max(15)
    .regex(passwordRegex, {message: 'Password must contain atleast one special char and one number'}).trim(),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword']})