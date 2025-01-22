import AWS from 'aws-sdk';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME } from '@env';
import { readAsStringAsync, EncodingType } from 'expo-file-system';
// import { readFile } from 'react-native-blob-util';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});

export default async function getPresignedUrl(fileName, fileType, folderName) {
    try {
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${folderName}/${fileName}`,
            Expires: 60 * 5,
            ContentType: fileType,
        };
        const response = await s3.getSignedUrlPromise('putObject', params);
        console.log('Pre-signed URL:', response);
        return response;
    } catch (error) {
        console.error('Failed to generate pre-signed URL', error);
        return null;
    }
}

export async function uploadFile(file, fileName, folderName) {
    try {
        const fileType = file.mimeType || 'application/octet-stream'; // MIME type of the file

        // Read file content as Base64
        const fileContent = await readAsStringAsync(file.uri, { encoding: EncodingType.Base64 });

        // Convert Base64 string to binary data
        const fileBuffer = Buffer.from(fileContent, 'base64');


        const signedUrl = await getPresignedUrl(fileName, fileType, folderName);
        if (!signedUrl) {
            console.error('Failed to get pre-signed URL');
            return false;
        }
        const uploadedResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': fileType,
            },
        });
        console.log("response", uploadedResponse);
        if (!uploadedResponse.ok) {
            console.error('Failed to upload file:', uploadedResponse.statusText);
            return false;
        }
        console.log('Image Uploaded successfully:');
        const imageUrl = `${folderName}/${fileName}`;
        return imageUrl;
    } catch (error) {
        console.error('Failed to upload file', error);
        return false;
    }
}

export async function deleteImage(filePath) {
    try {
        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: filePath, // Path to the file in the bucket (e.g., 'folderName/fileName')
        };

        const response = await s3.deleteObject(params).promise();
        console.log('Image deleted successfully:', response);
        return true;
    } catch (error) {
        console.error('Failed to delete image from S3:', error);
        return false;
    }
}
