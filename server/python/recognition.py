#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python手指模态识别脚本
支持4张图片比对：指纹、指静脉增强、指静脉二值化、指节纹
"""

import argparse
import json
import sys
import os
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from skimage import morphology
from torchvision import transforms
from transformers import ViTConfig, ViTModel


def mask_image2(image1: Image.Image, image2: Image.Image) -> Image.Image:
    """图像掩码处理 - 修复尺寸不匹配问题"""
    # 确保两张图片尺寸一致
    target_size = image1.size  # 使用第一张图片的尺寸
    if image2.size != target_size:
        image2 = image2.resize(target_size, Image.Resampling.LANCZOS)
    
    np_image1 = np.array(image1)
    np_image2 = np.array(image2)

    # 确保数组维度一致
    if np_image1.shape != np_image2.shape:
        # 如果形状仍然不匹配，使用最小的公共尺寸
        min_h = min(np_image1.shape[0], np_image2.shape[0])
        min_w = min(np_image1.shape[1], np_image2.shape[1])
        np_image1 = np_image1[:min_h, :min_w]
        np_image2 = np_image2[:min_h, :min_w]

    mask = np.all(np_image1 == [0, 0, 0], axis=-1).astype("uint8")
    selem = np.ones((5, 5))
    mask = morphology.binary_dilation(mask, selem)

    np_image2[mask] = [0, 0, 0]
    return Image.fromarray(np_image2)


class SiameseNetwork1(nn.Module):
    """三模态孪生网络"""
    def __init__(self, base_model1, base_model2, base_model3):
        super(SiameseNetwork1, self).__init__()

        self.base_model1 = base_model1

        self.fc1 = nn.Sequential(
            nn.Linear(768, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 32),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(32, 2),
        )
        self.fc2 = nn.Sequential(
            nn.Linear(768, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 32),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(32, 2),
        )
        self.fc3 = nn.Sequential(
            nn.Linear(768, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 32),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(32, 2),
        )
        self.fc4 = nn.Sequential(
            nn.Linear(4, 2),
        )
        self.fc5 = nn.Sequential(
            nn.Linear(4, 2),
        )
        self.fc6 = nn.Sequential(
            nn.Linear(4, 2),
        )
        self.softmax = nn.Softmax(dim=1)

    def forward(self, img1, img2, img3, img4, img5, img6, img7, img8):
        feat1 = self.base_model1(img1).last_hidden_state[:, 0, :]
        feat2 = self.base_model1(img2).last_hidden_state[:, 0, :]

        feat3 = self.base_model1(img3).last_hidden_state[:, 0, :]
        feat4 = self.base_model1(img4).last_hidden_state[:, 0, :]
        feat32 = self.base_model1(img5).last_hidden_state[:, 0, :]
        feat42 = self.base_model1(img6).last_hidden_state[:, 0, :]

        feat5 = self.base_model1(img7).last_hidden_state[:, 0, :]
        feat6 = self.base_model1(img8).last_hidden_state[:, 0, :]

        x1 = feat1 - feat2
        x2 = feat3 - feat4
        x22 = feat32 - feat42
        x3 = feat5 - feat6

        x1 = self.fc1(x1)
        x1 = self.softmax(x1)

        x2 = self.fc2(x2)
        x2 = self.softmax(x2)

        x22 = self.fc2(x22)
        x22 = self.softmax(x22)

        x3 = self.fc3(x3)
        x3 = self.softmax(x3)

        x2 = torch.cat((x2, x22), dim=1)
        x2 = self.fc4(x2)
        x2 = self.softmax(x2)

        x23 = torch.cat((x2, x3), dim=1)
        x23 = self.fc5(x23)
        x23 = self.softmax(x23)

        x123 = torch.cat((x1, x23), dim=1)
        x123 = self.fc6(x123)
        x123 = self.softmax(x123)

        return x123


class FingerRecognition:
    """手指模态识别器"""
    
    def __init__(self, model_path=None, device=None):
        if device is None:
            self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])
        
        # 初始化ViT模型
        config = ViTConfig()
        vit1 = ViTModel(config)
        
        # 初始化三模态模型
        self.model = SiameseNetwork1(base_model1=vit1, base_model2=None, base_model3=None)
        
        # 默认使用已知可用的模型文件
        if model_path is None:
            # 尝试使用默认的模型路径 
            default_model_path = r"C:\Users\28145\Desktop\py\model_epoch_3.pth"
            # 备用路径：项目中的模型文件
            project_model_path = os.path.join(os.path.dirname(__file__), "..", "..", "models", "model_epoch_3.pth")
            
            if os.path.exists(default_model_path):
                model_path = default_model_path
                print(f"📁 使用默认模型路径: {model_path}", file=sys.stderr)
            elif os.path.exists(project_model_path):
                model_path = project_model_path
                print(f"📁 使用项目模型路径: {model_path}", file=sys.stderr)
            else:
                print(f"⚠️ 未找到模型文件在路径: {default_model_path} 或 {project_model_path}", file=sys.stderr)
        
        # 如果提供了模型路径，尝试加载权重
        if model_path and os.path.exists(model_path):
            try:
                # 使用已验证可用的加载方法
                checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
                
                # 提取state_dict
                if isinstance(checkpoint, dict):
                    if 'model_state_dict' in checkpoint:
                        state_dict = checkpoint['model_state_dict']
                    elif 'state_dict' in checkpoint:
                        state_dict = checkpoint['state_dict']
                    elif 'model' in checkpoint:
                        state_dict = checkpoint['model']
                    else:
                        state_dict = checkpoint
                else:
                    state_dict = checkpoint
                
                # 清理state_dict中的module.前缀
                cleaned_state_dict = {}
                for k, v in state_dict.items():
                    if k.startswith("module."):
                        cleaned_state_dict[k[7:]] = v
                    else:
                        cleaned_state_dict[k] = v
                
                # 加载权重
                missing_keys, unexpected_keys = self.model.load_state_dict(cleaned_state_dict, strict=False)
                
                if len(missing_keys) > 0:
                    print(f"警告：缺少的键: {missing_keys[:5]}...", file=sys.stderr)
                if len(unexpected_keys) > 0:
                    print(f"警告：多余的键: {unexpected_keys[:5]}...", file=sys.stderr)
                    
                print(f"✅ 模型权重加载成功: {model_path}", file=sys.stderr)
                self.model_loaded = True
                
            except Exception as e:
                print(f"❌ 模型权重加载失败，使用随机权重: {e}", file=sys.stderr)
                self.model_loaded = False
        else:
            print("⚠️ 未找到模型文件，使用随机权重", file=sys.stderr)
            self.model_loaded = False
        
        self.model.to(self.device)
        self.model.eval()
    
    def recognize(self, fp1_path, fp2_path, vein_aug1_path, vein_aug2_path, 
                  vein_bin1_path, vein_bin2_path, knuckle1_path, knuckle2_path):
        """
        进行手指模态识别
        Args:
            fp1_path: 指纹图片1路径
            fp2_path: 指纹图片2路径
            vein_aug1_path: 指静脉增强图片1路径
            vein_aug2_path: 指静脉增强图片2路径
            vein_bin1_path: 指静脉二值图片1路径
            vein_bin2_path: 指静脉二值图片2路径
            knuckle1_path: 指节纹图片1路径
            knuckle2_path: 指节纹图片2路径
        """
        try:
            # 检查所有文件是否存在
            files = [fp1_path, fp2_path, vein_aug1_path, vein_aug2_path,
                    vein_bin1_path, vein_bin2_path, knuckle1_path, knuckle2_path]
            
            for file_path in files:
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"文件不存在: {file_path}")
            
            # 加载图像
            img1 = Image.open(fp1_path).convert('RGB')
            img2 = Image.open(fp2_path).convert('RGB')
            img2 = img2.resize((320, 240))
            img2 = mask_image2(img1, img2).convert('RGB')
            
            img3 = Image.open(vein_aug1_path).convert('RGB')
            img4 = Image.open(vein_aug2_path).convert('RGB')
            img5 = Image.open(vein_bin1_path).convert('RGB')
            img6 = Image.open(vein_bin2_path).convert('RGB')
            img7 = Image.open(knuckle1_path).convert('RGB')
            img8 = Image.open(knuckle2_path).convert('RGB')
            
            # 预处理
            tensor1 = self.transform(img1).unsqueeze(0).to(self.device)
            tensor2 = self.transform(img2).unsqueeze(0).to(self.device)
            tensor3 = self.transform(img3).unsqueeze(0).to(self.device)
            tensor4 = self.transform(img4).unsqueeze(0).to(self.device)
            tensor5 = self.transform(img5).unsqueeze(0).to(self.device)
            tensor6 = self.transform(img6).unsqueeze(0).to(self.device)
            tensor7 = self.transform(img7).unsqueeze(0).to(self.device)
            tensor8 = self.transform(img8).unsqueeze(0).to(self.device)
            
            # 推理
            with torch.no_grad():
                outputs = self.model(tensor1, tensor2, tensor3, tensor4, 
                                   tensor5, tensor6, tensor7, tensor8)
            
            # 获取概率分数
            prob_different = outputs[0, 0].item()
            prob_same = outputs[0, 1].item()
            
            # 使用训练好的模型时，调整阈值判断
            if self.model_loaded:
                # 对于训练好的模型，使用更合理的阈值
                confidence_threshold = 0.6
                is_match = prob_same > confidence_threshold
                confidence = prob_same
            else:
                # 对于随机权重，使用简单的比较
                is_match = prob_same > prob_different  
                confidence = max(prob_same, prob_different)
            
            return {
                'success': True,
                'is_match': is_match,
                'match_probability': prob_same,
                'different_probability': prob_different,
                'confidence': confidence,
                'model_loaded': self.model_loaded
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


def main():
    parser = argparse.ArgumentParser(description='手指模态识别脚本')
    
    # 输入图片参数
    parser.add_argument('--fp1', required=True, help='指纹图片1路径')
    parser.add_argument('--fp2', required=True, help='指纹图片2路径')
    parser.add_argument('--vein-aug1', required=True, help='指静脉增强图片1路径')
    parser.add_argument('--vein-aug2', required=True, help='指静脉增强图片2路径')
    parser.add_argument('--vein-bin1', required=True, help='指静脉二值图片1路径')
    parser.add_argument('--vein-bin2', required=True, help='指静脉二值图片2路径')
    parser.add_argument('--knuckle1', required=True, help='指节纹图片1路径')
    parser.add_argument('--knuckle2', required=True, help='指节纹图片2路径')
    
    # 可选参数
    parser.add_argument('--model-path', help='训练好的模型权重路径')
    parser.add_argument('--device', default='auto', help='计算设备 (cpu/cuda:0/auto)')
    parser.add_argument('--output-json', action='store_true', help='输出JSON格式结果')
    
    args = parser.parse_args()
    
    # 设备选择
    if args.device == 'auto':
        device = None
    else:
        device = args.device
    
    try:
        # 初始化识别器
        recognizer = FingerRecognition(model_path=args.model_path, device=device)
        
        # 执行识别
        result = recognizer.recognize(
            args.fp1, args.fp2,
            args.vein_aug1, args.vein_aug2,
            args.vein_bin1, args.vein_bin2,
            args.knuckle1, args.knuckle2
        )
        
        if args.output_json:
            print(json.dumps(result, ensure_ascii=False))
        else:
            if result['success']:
                print(f"识别成功:")
                print(f"  匹配结果: {'匹配' if result['is_match'] else '不匹配'}")
                print(f"  匹配概率: {result['match_probability']:.4f}")
                print(f"  不匹配概率: {result['different_probability']:.4f}")
                print(f"  置信度: {result['confidence']:.4f}")
            else:
                print(f"识别失败: {result['error']}")
                sys.exit(1)
                
    except Exception as e:
        if args.output_json:
            print(json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False))
        else:
            print(f"程序执行失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
