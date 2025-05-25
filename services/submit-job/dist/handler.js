"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const env = {
    MEDIACONVERT_ENDPOINT: process.env.MEDIACONVERT_ENDPOINT,
    MEDIACONVERT_ROLE_ARN: process.env.MEDIACONVERT_ROLE_ARN,
    JOB_TEMPLATE_NAME: process.env.JOB_TEMPLATE_NAME,
    OUTPUT_BUCKET_NAME: process.env.OUTPUT_BUCKET_NAME,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
};
const mediaConvertClient = new client_mediaconvert_1.MediaConvertClient({
    region: env.AWS_REGION,
    endpoint: env.MEDIACONVERT_ENDPOINT,
});
const s3Client = new client_s3_1.S3Client({ region: env.AWS_REGION });
const sqsClient = new client_sqs_1.SQSClient({ region: env.AWS_REGION });
async function validateS3Object(bucket, key) {
    try {
        await s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: key }));
        console.log(`S3オブジェクトを確認しました: s3://${bucket}/${key}`);
    }
    catch (error) {
        throw new Error(`S3オブジェクトが見つかりません: s3://${bucket}/${key}`);
    }
}
async function createMediaConvertJob(params) {
    const createJobParams = {
        Role: env.MEDIACONVERT_ROLE_ARN,
        JobTemplate: env.JOB_TEMPLATE_NAME,
        UserMetadata: {
            InputS3Uri: params.inputS3Uri,
            ProcessedAt: new Date().toISOString(),
        },
        Settings: {
            Inputs: [
                {
                    FileInput: params.inputS3Uri,
                },
            ],
        },
        ClientRequestToken: params.jobIdempotencyToken,
    };
    try {
        const response = await mediaConvertClient.send(new client_mediaconvert_1.CreateJobCommand(createJobParams));
        const jobId = response.Job?.Id;
        if (!jobId) {
            throw new Error('MediaConvertジョブIDが取得できませんでした');
        }
        console.log(`MediaConvertジョブを作成しました: ${jobId}`);
        return jobId;
    }
    catch (error) {
        console.error('MediaConvertジョブの作成に失敗しました:', error);
        throw error;
    }
}
async function sendJobStartNotification(jobId, inputS3Uri, outputS3UriPrefix) {
    const message = {
        eventType: 'JOB_STARTED',
        jobId,
        inputS3Uri,
        outputS3UriPrefix,
        timestamp: new Date().toISOString(),
    };
    try {
        await sqsClient.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                EventType: {
                    DataType: 'String',
                    StringValue: 'JOB_STARTED',
                },
                JobId: {
                    DataType: 'String',
                    StringValue: jobId,
                },
            },
        }));
        console.log(`SQSにジョブ開始通知を送信しました: ${jobId}`);
    }
    catch (error) {
        console.error('SQSへの通知送信に失敗しました:', error);
        throw error;
    }
}
function generateOutputPath(inputKey) {
    const keyWithoutExtension = inputKey.replace(/\.[^/.]+$/, '');
    return `processed/${keyWithoutExtension}/`;
}
function generateIdempotencyToken(bucket, key) {
    const timestamp = Math.floor(Date.now() / 1000);
    const source = `${bucket}/${key}/${timestamp}`;
    return Buffer.from(source).toString('base64').substring(0, 32);
}
const handler = async (event, _context) => {
    console.log('SubmitJob Lambda関数が開始されました');
    console.log('受信イベント:', JSON.stringify(event, null, 2));
    const results = [];
    for (const record of event.Records) {
        try {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            console.log(`処理開始: s3://${bucket}/${key}`);
            const supportedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
            const fileExtension = key.toLowerCase().substring(key.lastIndexOf('.'));
            if (!supportedExtensions.includes(fileExtension)) {
                console.log(`サポートされていないファイル形式です: ${fileExtension}`);
                continue;
            }
            await validateS3Object(bucket, key);
            const inputS3Uri = `s3://${bucket}/${key}`;
            const outputPath = generateOutputPath(key);
            const outputS3UriPrefix = `s3://${env.OUTPUT_BUCKET_NAME}/${outputPath}`;
            const jobIdempotencyToken = generateIdempotencyToken(bucket, key);
            const jobParameters = {
                inputS3Uri,
                outputS3UriPrefix,
                jobIdempotencyToken,
            };
            const jobId = await createMediaConvertJob(jobParameters);
            await sendJobStartNotification(jobId, inputS3Uri, outputS3UriPrefix);
            results.push({
                success: true,
                inputS3Uri,
                jobId,
                outputS3UriPrefix,
            });
            console.log(`処理完了: ${inputS3Uri} -> JobID: ${jobId}`);
        }
        catch (error) {
            console.error(`処理エラー:`, error);
            results.push({
                success: false,
                error: error instanceof Error ? error.message : String(error),
                inputS3Uri: `s3://${record.s3.bucket.name}/${record.s3.object.key}`,
            });
        }
    }
    console.log('SubmitJob Lambda関数が完了しました');
    console.log('処理結果:', JSON.stringify(results, null, 2));
};
exports.handler = handler;
