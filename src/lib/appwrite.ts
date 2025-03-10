import { Client, Storage } from "appwrite"
import { toast } from "sonner"

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('678214740011efc3b8ec')

const storage = new Storage(client)

export async function uploadFile(file: File | undefined, setProgress: (progress: number) => void) {
    
    if(!file) throw new Error("File is undefined")
    
    const fileKey = Date.now() + '_' + file.name.replace(' ', '-')
    const fileId = fileKey.slice(0,15)

    // toast.success(progress.progress)
    const res = await storage.createFile('67a1c05b0038ea6a4986', fileId, file, [] , ({ progress }) => setProgress(progress))

    const fileUrl = storage.getFileView('67a1c05b0038ea6a4986', fileId)
    return { fileKey, fileUrl}
}

