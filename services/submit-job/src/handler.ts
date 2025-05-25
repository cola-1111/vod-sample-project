import { S3Event, S3Handler, Context } from 'aws-lambda';
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// 環境変数の型定義
interface Environment {
  MEDIACONVERT_ENDPOINT: string;
  MEDIACONVERT_ROLE_ARN: string;
  JOB_TEMPLATE_NAME: string;
  OUTPUT_BUCKET_NAME: string;
  SQS_QUEUE_URL: string;
  AWS_REGION: string;
}

// MediaConvert ジョブのパラメータ型定義
interface JobParameters {
  inputS3Uri: string;
  outputS3UriPrefix: string;
  jobIdempotencyToken: string;
}

// Lambda環境変数の取得
const env: Environment = {
  MEDIACONVERT_ENDPOINT: process.env.MEDIACONVERT_ENDPOINT!,
  MEDIACONVERT_ROLE_ARN: process.env.MEDIACONVERT_ROLE_ARN!,
  JOB_TEMPLATE_NAME: process.env.JOB_TEMPLATE_NAME!,
  OUTPUT_BUCKET_NAME: process.env.OUTPUT_BUCKET_NAME!,
  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
  AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
};

// AWSクライアントの初期化
const mediaConvertClient = new MediaConvertClient({
  region: env.AWS_REGION,
  endpoint: env.MEDIACONVERT_ENDPOINT,
});

const s3Client = new S3Client({ region: env.AWS_REGION });
const sqsClient = new SQSClient({ region: env.AWS_REGION });

/**
 * S3オブジェクトの存在確認とメタデータ取得
 */
async function validateS3Object(bucket: string, key: string): Promise<void> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`S3オブジェクトを確認しました: s3://${bucket}/${key}`);
  } catch (error) {
    throw new Error(`S3オブジェクトが見つかりません: s3://${bucket}/${key}`);
  }
}

/**
 * MediaConvertジョブの作成（JobTemplateを使用）
 */
async function createMediaConvertJob(params: JobParameters): Promise<string> {
  const createJobParams = {
    Role: env.MEDIACONVERT_ROLE_ARN,
    JobTemplate: env.JOB_TEMPLATE_NAME,
    UserMetadata: {
      InputS3Uri: params.inputS3Uri,
      ProcessedAt: new Date().toISOString(),
    },
    // JobTemplateを使用する場合、入力ファイルのみを指定
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
    const response = await mediaConvertClient.send(new CreateJobCommand(createJobParams));
    const jobId = response.Job?.Id;
    
    if (!jobId) {
      throw new Error('MediaConvertジョブIDが取得できませんでした');
    }

    console.log(`MediaConvertジョブを作成しました: ${jobId}`);
    return jobId;
  } catch (error) {
    console.error('MediaConvertジョブの作成に失敗しました:', error);
    throw error;
  }
}

/**
 * SQSにジョブ開始通知を送信
 */
async function sendJobStartNotification(
  jobId: string,
  inputS3Uri: string,
  outputS3UriPrefix: string
): Promise<void> {
  const message = {
    eventType: 'JOB_STARTED',
    jobId,
    inputS3Uri,
    outputS3UriPrefix,
    timestamp: new Date().toISOString(),
  };

  try {
    await sqsClient.send(new SendMessageCommand({
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
  } catch (error) {
    console.error('SQSへの通知送信に失敗しました:', error);
    throw error;
  }
}

/**
 * S3キーから出力パスを生成
 */
function generateOutputPath(inputKey: string): string {
  // 拡張子を除去してディレクトリパスを生成
  const keyWithoutExtension = inputKey.replace(/\.[^/.]+$/, '');
  return `processed/${keyWithoutExtension}/`;
}

/**
 * 冪等性トークンの生成
 */
function generateIdempotencyToken(bucket: string, key: string): string {
  // S3パスとタイムスタンプを組み合わせてユニークなトークンを生成
  const timestamp = Math.floor(Date.now() / 1000); // 秒単位
  const source = `${bucket}/${key}/${timestamp}`;
  return Buffer.from(source).toString('base64').substring(0, 32);
}

/**
 * メインハンドラー関数
 */
export const handler: S3Handler = async (event: S3Event, _context: Context): Promise<void> => {
  console.log('SubmitJob Lambda関数が開始されました');
  console.log('受信イベント:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`処理開始: s3://${bucket}/${key}`);

      // 対応ファイル形式のチェック
      const supportedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
      const fileExtension = key.toLowerCase().substring(key.lastIndexOf('.'));
      
      if (!supportedExtensions.includes(fileExtension)) {
        console.log(`サポートされていないファイル形式です: ${fileExtension}`);
        continue;
      }

      // S3オブジェクトの存在確認
      await validateS3Object(bucket, key);

      // パラメータの準備
      const inputS3Uri = `s3://${bucket}/${key}`;
      const outputPath = generateOutputPath(key);
      const outputS3UriPrefix = `s3://${env.OUTPUT_BUCKET_NAME}/${outputPath}`;
      const jobIdempotencyToken = generateIdempotencyToken(bucket, key);

      const jobParameters: JobParameters = {
        inputS3Uri,
        outputS3UriPrefix,
        jobIdempotencyToken,
      };

      // MediaConvertジョブの作成
      const jobId = await createMediaConvertJob(jobParameters);

      // SQSに通知送信
      await sendJobStartNotification(jobId, inputS3Uri, outputS3UriPrefix);

      results.push({
        success: true,
        inputS3Uri,
        jobId,
        outputS3UriPrefix,
      });

      console.log(`処理完了: ${inputS3Uri} -> JobID: ${jobId}`);

    } catch (error) {
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