import { Client, Storage} from 'node-appwrite'
import fs from 'fs'

const secretKey = process.env.APPWRITE_SECRET_KEY ?? ''

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('678214740011efc3b8ec')
    .setKey(secretKey)

const storage = new Storage(client)

export async function downloadFile(fileKey: string) {

   const result = await storage.getFileDownload('67a1c05b0038ea6a4986', fileKey.slice(0,15))

   const buffer = Buffer.from(result)
   const filePath = process.cwd() +  `/files/${fileKey}`

   fs.writeFileSync(filePath, buffer)
   return filePath
}