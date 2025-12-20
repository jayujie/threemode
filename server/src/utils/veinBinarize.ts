import { spawn } from "child_process";
import path from "path";

const PYTHON_SCRIPT = path.resolve(__dirname, "..", "..", "..", "vein_binarize.py");

export async function binarizeVeinImage(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      PYTHON_SCRIPT,
      "-i", inputPath,
      "-o", outputPath
    ]);

    let stderr = "";

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`二值化处理失败: ${stderr}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`无法启动Python进程: ${err.message}`));
    });
  });
}
