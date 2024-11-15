import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


const imageClient = new S3Client({
    region: process.env.AWS_REGION!,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
})


export async function uploadFileToS3(file: ArrayBuffer, fileName: string): Promise<string> {
    const fileBuffer = Buffer.from(file);
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!bucketName) {
        throw new Error("AWS_BUCKET_NAME environment variable is not defined");
    }

    const key = `${fileName}-${Date.now()}`; // Unique file key

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: 'image/jpeg', // Adjust as needed
    };

    const command = new PutObjectCommand(params);

    try {
        await imageClient.send(command);
        console.log("File uploaded successfully to S3 with key:", key);
        return key; // Return the unique file key
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("logo_file")

        if(!file || !(file instanceof File)){
            return NextResponse.json({error:'file is required'}, {status:400})
        }
        
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = await uploadFileToS3(buffer, file.name);

        return NextResponse.json({success:true, fileName})

    } catch (error) {
        return NextResponse.json({error:error})
    }

    return NextResponse.json({msg:"hello"})
}