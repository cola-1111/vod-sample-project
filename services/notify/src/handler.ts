import { EventBridgeEvent, Context } from 'aws-lambda';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// MediaConvert完了イベントの型定義
interface MediaConvertCompleteEvent {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  detail: {
    status: 'COMPLETE' | 'ERROR' | 'CANCELED';
    jobId: string;
    queue: string;
    userMetadata?: {
      InputS3Uri?: string;
      ProcessedAt?: string;
    };
    outputGroupDetails?: Array<{
      outputDetails?: Array<{
        outputFilePaths?: string[];
      }>;
    }>;
  };
}

// 環境変数の型定義
interface Environment {
  OUTPUT_BUCKET_NAME: string;
  SQS_QUEUE_URL: string;
  SNS_TOPIC_ARN?: string;
  AWS_REGION: string;
}

// 処理結果の型定義
interface ProcessingResult {
  jobId: string;
  status: string;
  inputS3Uri?: string;
  outputFiles: {
    hlsManifest?: string;
    hlsSegments: string[];
    thumbnails: string[];
  };
  cloudFrontUrls?: {
    hlsManifest?: string;
    thumbnails: string[];
  };
}

// Lambda環境変数の取得
const env: Environment = {
  OUTPUT_BUCKET_NAME: process.env.OUTPUT_BUCKET_NAME!,
  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
  SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN,
  AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
};

// AWSクライアントの初期化
const s3Client = new S3Client({ region: env.AWS_REGION });
const sqsClient = new SQSClient({ region: env.AWS_REGION });
const snsClient = new SNSClient({ region: env.AWS_REGION });

/**
 * S3バケットから処理結果ファイルを検索
 */
async function findOutputFiles(_jobId: string): Promise<{
  hlsManifest?: string;
  hlsSegments: string[];
  thumbnails: string[];
}> {
  const hlsSegments: string[] = [];
  const thumbnails: string[] = [];
  let hlsManifest: string | undefined;

  try {
    // 出力ディレクトリを探索
    const listParams = {
      Bucket: env.OUTPUT_BUCKET_NAME,
      Prefix: 'processed/',
    };

    const response = await s3Client.send(new ListObjectsV2Command(listParams));
    
    if (response.Contents) {
      for (const object of response.Contents) {
        const key = object.Key!;
        
        // HLSマニフェストファイル
        if (key.endsWith('.m3u8') && key.includes('hls/')) {
          hlsManifest = key;
        }
        
        // HLSセグメントファイル
        if (key.endsWith('.ts') && key.includes('hls/')) {
          hlsSegments.push(key);
        }
        
        // サムネイルファイル
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
  } catch (error) {
    console.error('出力ファイルの検索に失敗しました:', error);
    return {
      hlsSegments: [],
      thumbnails: [],
    };
  }
}

/**
 * CloudFrontのURLを生成
 */
function generateCloudFrontUrls(files: {
  hlsManifest?: string;
  hlsSegments: string[];
  thumbnails: string[];
}): {
  hlsManifest?: string;
  thumbnails: string[];
} {
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

/**
 * SQSに完了通知を送信
 */
async function sendCompletionNotification(result: ProcessingResult): Promise<void> {
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
    await sqsClient.send(new SendMessageCommand({
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
  } catch (error) {
    console.error('SQSへの通知送信に失敗しました:', error);
    throw error;
  }
}

/**
 * SNSに完了通知を送信（オプション）
 */
async function sendSnsNotification(result: ProcessingResult): Promise<void> {
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
    await snsClient.send(new PublishCommand({
      TopicArn: env.SNS_TOPIC_ARN,
      Subject: subject,
      Message: JSON.stringify(message, null, 2),
    }));

    console.log(`SNS通知を送信しました: ${result.jobId}`);
  } catch (error) {
    console.error('SNS通知の送信に失敗しました:', error);
    // SNS通知失敗は致命的なエラーではないため、継続処理
  }
}

/**
 * メインハンドラー関数
 */
export const handler = async (
  event: EventBridgeEvent<'MediaConvert Job State Change', MediaConvertCompleteEvent['detail']>,
  _context: Context
) => {
  console.log('Notify Lambda関数が開始されました');
  console.log('受信イベント:', JSON.stringify(event, null, 2));

  try {
    const detail = event.detail;
    const jobId = detail.jobId;
    const status = detail.status;

    console.log(`MediaConvertジョブ ${jobId} の状態: ${status}`);

    // 成功した場合のみ出力ファイルを検索
    let outputFiles = {
      hlsSegments: [] as string[],
      thumbnails: [] as string[],
    };

    if (status === 'COMPLETE') {
      outputFiles = await findOutputFiles(jobId);
    }

    // 処理結果の構築
    const result: ProcessingResult = {
      jobId,
      status,
      inputS3Uri: detail.userMetadata?.InputS3Uri,
      outputFiles,
      cloudFrontUrls: status === 'COMPLETE' ? generateCloudFrontUrls(outputFiles) : undefined,
    };

    // SQSに通知送信
    await sendCompletionNotification(result);

    // SNSに通知送信（オプション）
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

  } catch (error) {
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