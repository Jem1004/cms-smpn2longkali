import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import type { PresignResult } from "@/types"

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function generatePresignedUrl(
  filename: string,
  contentType: string
): Promise<PresignResult> {
  const bucket = process.env.AWS_S3_BUCKET!
  const region = process.env.AWS_REGION!

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  // Store files in cms-sekolah folder to keep organized in shared bucket
  const key = `cms-smpn3ppu/uploads/${Date.now()}-${randomUUID()}-${sanitizedFilename}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

  return { uploadUrl, fileUrl, key }
}

export async function deleteS3Object(key: string): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET!

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await s3Client.send(command)
}
