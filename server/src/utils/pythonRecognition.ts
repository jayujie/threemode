import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface RecognitionResult {
  isMatch: boolean;
  matchProbability: number;
  differentProbability: number;
  confidence: number;
  modelLoaded?: boolean;
}

export interface RecognitionInput {
  fingerprint1Path: string;
  fingerprint2Path: string;
  veinAug1Path: string;
  veinAug2Path: string;
  veinBin1Path: string;
  veinBin2Path: string;
  knuckle1Path: string;
  knuckle2Path: string;
}

/**
 * 调用Python识别脚本进行手指模态比对
 */
export async function performPythonRecognition(
  input: RecognitionInput
): Promise<RecognitionResult> {
  return new Promise((resolve, reject) => {
    // Python脚本路径（需要根据实际部署调整）
    const pythonScriptPath = path.join(__dirname, '..', '..', 'python', 'recognition.py');
    
    // 检查Python脚本是否存在
    if (!fs.existsSync(pythonScriptPath)) {
      reject(new Error(`Python脚本不存在: ${pythonScriptPath}`));
      return;
    }

    // 检查所有输入文件是否存在
    const inputFiles = [
      input.fingerprint1Path,
      input.fingerprint2Path, 
      input.veinAug1Path,
      input.veinAug2Path,
      input.veinBin1Path,
      input.veinBin2Path,
      input.knuckle1Path,
      input.knuckle2Path
    ];

    for (const filePath of inputFiles) {
      if (!fs.existsSync(filePath)) {
        reject(new Error(`输入文件不存在: ${filePath}`));
        return;
      }
    }

    // 构建Python命令参数
    const args = [
      pythonScriptPath,
      '--fp1', input.fingerprint1Path,
      '--fp2', input.fingerprint2Path,
      '--vein-aug1', input.veinAug1Path,
      '--vein-aug2', input.veinAug2Path,
      '--vein-bin1', input.veinBin1Path,
      '--vein-bin2', input.veinBin2Path,
      '--knuckle1', input.knuckle1Path,
      '--knuckle2', input.knuckle2Path,
      '--output-json'
    ];

    // 启动Python进程
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python脚本执行失败，退出码: ${code}\n错误信息: ${stderr}`));
        return;
      }

      try {
        // 解析Python脚本的JSON输出
        const result = JSON.parse(stdout.trim());
        
        if (result.error) {
          reject(new Error(`Python识别错误: ${result.error}`));
          return;
        }

        resolve({
          isMatch: result.is_match || false,
          matchProbability: result.match_probability || 0,
          differentProbability: result.different_probability || 0,
          confidence: result.confidence || 0
        });
      } catch (parseError) {
        reject(new Error(`解析Python输出失败: ${parseError}\n原始输出: ${stdout}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`启动Python进程失败: ${error.message}`));
    });

    // 设置超时（30秒）
    setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      reject(new Error('Python识别超时'));
    }, 30000);
  });
}

/**
 * 简化版本：使用默认参数进行识别
 */
export async function simpleRecognition(
  registeredFeatures: {
    fingerprintPath: string;
    veinAugPath: string;
    veinBinPath: string;
    knucklePath: string;
  },
  uploadedFeatures: {
    fingerprintPath: string;
    veinAugPath: string;
    veinBinPath: string;
    knucklePath: string;
  }
): Promise<RecognitionResult> {
  return performPythonRecognition({
    fingerprint1Path: registeredFeatures.fingerprintPath,
    fingerprint2Path: uploadedFeatures.fingerprintPath,
    veinAug1Path: registeredFeatures.veinAugPath,
    veinAug2Path: uploadedFeatures.veinAugPath,
    veinBin1Path: registeredFeatures.veinBinPath,
    veinBin2Path: uploadedFeatures.veinBinPath,
    knuckle1Path: registeredFeatures.knucklePath,
    knuckle2Path: uploadedFeatures.knucklePath
  });
}

/**
 * 批量识别：对多个用户特征进行比对
 */
export async function batchRecognition(
  uploadedFeatures: {
    fingerprintPath: string;
    veinAugPath: string;
    veinBinPath: string;
    knucklePath: string;
  },
  candidateUsers: Array<{
    userId: number;
    fingerprintPath: string;
    veinAugPath: string;
    veinBinPath: string;
    knucklePath: string;
  }>
): Promise<Array<{ userId: number; result: RecognitionResult }>> {
  const results: Array<{ userId: number; result: RecognitionResult }> = [];

  for (const candidate of candidateUsers) {
    try {
      const result = await simpleRecognition(candidate, uploadedFeatures);
      results.push({ userId: candidate.userId, result });
    } catch (error) {
      console.error(`用户 ${candidate.userId} 识别失败:`, error);
      // 继续处理其他用户，不要因为一个失败而中断
      results.push({
        userId: candidate.userId,
        result: {
          isMatch: false,
          matchProbability: 0,
          differentProbability: 1,
          confidence: 0
        }
      });
    }
  }

  return results;
}
