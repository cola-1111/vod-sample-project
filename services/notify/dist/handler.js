"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_sns_1 = require("@aws-sdk/client-sns");
const env = {
    OUTPUT_BUCKET_NAME: process.env.OUTPUT_BUCKET_NAME,
    SQS_QUEUE_URL: process.env.SQS_QUEUE_URL,
    SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN,
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
};
const s3Client = new client_s3_1.S3Client({ region: env.AWS_REGION });
const sqsClient = new client_sqs_1.SQSClient({ region: env.AWS_REGION });
const snsClient = new client_sns_1.SNSClient({ region: env.AWS_REGION });
async function findOutputFiles(_jobId) {
    const hlsSegments = [];
    const thumbnails = [];
    let hlsManifest;
    try {
        const listParams = {
            Bucket: env.OUTPUT_BUCKET_NAME,
            Prefix: 'processed/',
        };
        const response = await s3Client.send(new client_s3_1.ListObjectsV2Command(listParams));
        if (response.Contents) {
            for (const object of response.Contents) {
                const key = object.Key;
                if (key.endsWith('.m3u8') && key.includes('hls/')) {
                    hlsManifest = key;
                }
                if (key.endsWith('.ts') && key.includes('hls/')) {
                    hlsSegments.push(key);
                }
                if ((key.endsWith('.jpg') || key.endsWith('.png')) && key.includes('thumbnails/')) {
                    thumbnails.push(key);
                }
            }
        }
        console.log(`出力ファイル検索結果 - HLSマニフェスト: ${hlsManifest}, セグメント: ${hlsSegments.length}件, サムネイル: ${thumbnails.length}件`);
        return {
            hlsManifest,
            hlsSegments,
            thumbnails,
        };
    }
    catch (error) {
        console.error('出力ファイルの検索に失敗しました:', error);
        return {
            hlsSegments: [],
            thumbnails: [],
        };
    }
}
function generateCloudFrontUrls(files) {
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (!cloudFrontDomain) {
        console.log('CloudFrontドメインが設定されていません');
        return { thumbnails: [] };
    }
    const cloudFrontUrls = {
        hlsManifest: files.hlsManifest ? `https://${cloudFrontDomain}/${files.hlsManifest}` : undefined,
        thumbnails: files.thumbnails.map(thumb => `https://${cloudFrontDomain}/${thumb}`),
    };
    return cloudFrontUrls;
}
async function sendCompletionNotification(result) {
    const message = {
        eventType: result.status === 'COMPLETE' ? 'JOB_COMPLETED' : 'JOB_FAILED',
        jobId: result.jobId,
        status: result.status,
        inputS3Uri: result.inputS3Uri,
        outputFiles: result.outputFiles,
        cloudFrontUrls: result.cloudFrontUrls,
        timestamp: new Date().toISOString(),
    };
    try {
        await sqsClient.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(message),
            MessageAttributes: {
                EventType: {
                    DataType: 'String',
                    StringValue: message.eventType,
                },
                JobId: {
                    DataType: 'String',
                    StringValue: result.jobId,
                },
                Status: {
                    DataType: 'String',
                    StringValue: result.status,
                },
            },
        }));
        console.log(`SQSに完了通知を送信しました: ${result.jobId}`);
    }
    catch (error) {
        console.error('SQSへの通知送信に失敗しました:', error);
        throw error;
    }
}
async function sendSnsNotification(result) {
    if (!env.SNS_TOPIC_ARN) {
        console.log('SNSトピックが設定されていないため、SNS通知をスキップします');
        return;
    }
    const subject = result.status === 'COMPLETE'
        ? 'VOD処理が完了しました'
        : 'VOD処理が失敗しました';
    const message = {
        subject,
        jobId: result.jobId,
        status: result.status,
        inputFile: result.inputS3Uri,
        outputSummary: {
            hlsAvailable: !!result.outputFiles.hlsManifest,
            hlsSegments: result.outputFiles.hlsSegments.length,
            thumbnails: result.outputFiles.thumbnails.length,
        },
        cloudFrontUrls: result.cloudFrontUrls,
        timestamp: new Date().toISOString(),
    };
    try {
        await snsClient.send(new client_sns_1.PublishCommand({
            TopicArn: env.SNS_TOPIC_ARN,
            Subject: subject,
            Message: JSON.stringify(message, null, 2),
        }));
        console.log(`SNS通知を送信しました: ${result.jobId}`);
    }
    catch (error) {
        console.error('SNS通知の送信に失敗しました:', error);
    }
}
const handler = async (event, _context) => {
    console.log('Notify Lambda関数が開始されました');
    console.log('受信イベント:', JSON.stringify(event, null, 2));
    try {
        const detail = event.detail;
        const jobId = detail.jobId;
        const status = detail.status;
        console.log(`MediaConvertジョブ ${jobId} の状態: ${status}`);
        let outputFiles = {
            hlsSegments: [],
            thumbnails: [],
        };
        if (status === 'COMPLETE') {
            outputFiles = await findOutputFiles(jobId);
        }
        const result = {
            jobId,
            status,
            inputS3Uri: detail.userMetadata?.InputS3Uri,
            outputFiles,
            cloudFrontUrls: status === 'COMPLETE' ? generateCloudFrontUrls(outputFiles) : undefined,
        };
        await sendCompletionNotification(result);
        await sendSnsNotification(result);
        console.log('Notify Lambda関数が正常に完了しました');
        console.log('処理結果:', JSON.stringify(result, null, 2));
        return {
            statusCode: 200,
            body: {
                success: true,
                jobId,
                status,
                message: '通知が正常に送信されました',
            },
        };
    }
    catch (error) {
        console.error('Notify Lambda関数でエラーが発生しました:', error);
        return {
            statusCode: 500,
            body: {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: '通知の送信に失敗しました',
            },
        };
    }
};
exports.handler = handler;
