#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
指静脉图像二值化处理脚本（简化版）
从 binarization.py 提取核心二值化操作
使用方法：python vein_binarize.py -i 输入图片路径 -o 输出路径
"""

import argparse
import cv2
import numpy as np
from skimage.filters import threshold_sauvola
from skimage.morphology import remove_small_objects
from skimage import img_as_ubyte
import os


def anisotropic_diffusion(img, niter=5, kappa=100, gamma=0.1):
    """
    各向异性扩散滤波（Perona-Malik算法）
    """
    if img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = img.astype('float32')
    delta = np.zeros_like(img)
    h, w = img.shape

    for _ in range(niter):
        grad_n = img[:-1, :] - img[1:, :]
        grad_s = img[1:, :] - img[:-1, :]
        grad_e = img[:, :-1] - img[:, 1:]
        grad_w = img[:, 1:] - img[:, :-1]

        c_n = np.exp(-(grad_n / kappa) ** 2)
        c_s = np.exp(-(grad_s / kappa) ** 2)
        c_e = np.exp(-(grad_e / kappa) ** 2)
        c_w = np.exp(-(grad_w / kappa) ** 2)

        delta[1:-1, 1:-1] = gamma * (
                c_n[:-1, 1:-1] * grad_n[:-1, 1:-1] +
                c_s[1:, 1:-1] * grad_s[1:, 1:-1] +
                c_e[1:-1, :-1] * grad_e[1:-1, :-1] +
                c_w[1:-1, 1:] * grad_w[1:-1, 1:]
        )

        img += delta
    return np.clip(img, 0, 255).astype('uint8')


def gabor_enhance(img, theta=0, freq=0.1, sigma=4):
    """Gabor滤波器增强特定方向静脉"""
    kernel = cv2.getGaborKernel(
        ksize=(15, 15),
        sigma=sigma,
        theta=theta,
        lambd=10,
        gamma=0.3,
        psi=0,
        ktype=cv2.CV_32F
    )
    kernel /= 1.5 * kernel.sum()
    return cv2.filter2D(img, cv2.CV_8UC3, kernel)


def imread_unicode(path, flags=cv2.IMREAD_GRAYSCALE):

    return cv2.imdecode(np.fromfile(path, dtype=np.uint8), flags)


def imwrite_unicode(path, img):

    ext = os.path.splitext(path)[1]
    cv2.imencode(ext, img)[1].tofile(path)


def binarize_vein_image(input_path, output_path=None):
    """
    对指静脉增强图像进行二值化处理
    
    Args:
        input_path: 输入增强图像路径
        output_path: 输出二值化图像路径（可选）
    
    Returns:
        二值化后的图像
    """
    img = imread_unicode(input_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"无法读取图像: {input_path}")

    shadow_gamma = 2.2
    contrast_alpha = 1.9
    highlight_strength = 50

    img_augmentation = np.power(img.astype(np.float32) / 255, shadow_gamma) * 255
    img_augmentation = np.clip(img_augmentation, 0, 255).astype(np.uint8)
    img_augmentation = cv2.convertScaleAbs(img_augmentation, alpha=contrast_alpha, beta=0)

    if img_augmentation.ndim == 2 or (img_augmentation.ndim == 3 and img_augmentation.shape[2] == 1):
        img_augmentation = cv2.cvtColor(img_augmentation, cv2.COLOR_GRAY2BGR)

    hls = cv2.cvtColor(img_augmentation, cv2.COLOR_BGR2HLS)
    l_channel = hls[:, :, 1].astype(np.float32)
    adjusted_l = l_channel - (l_channel / 255.0) * highlight_strength
    hls[:, :, 1] = np.clip(adjusted_l, 0, 255).astype(np.uint8)
    img_augmentation = cv2.cvtColor(hls, cv2.COLOR_HLS2BGR)

    filtered = anisotropic_diffusion(img_augmentation)

    clahe = cv2.createCLAHE(clipLimit=1, tileGridSize=(2, 2))
    enhanced = clahe.apply(filtered)

    angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
    gabor_result = np.zeros_like(enhanced)
    for angle in angles:
        gabor_result = np.maximum(gabor_result, gabor_enhance(enhanced, theta=angle))
    enhanced = cv2.addWeighted(enhanced, 0.95, gabor_result, 0.05, 0)

    window_sizes = [27, 31, 35]
    combined = np.zeros_like(enhanced, dtype=bool)

    for ws in window_sizes:
        thresh = threshold_sauvola(enhanced, window_size=ws, k=0.06)
        combined = np.logical_or(combined, enhanced > thresh)

    binary = img_as_ubyte(combined)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (1, 1))
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    min_size = 50
    cleaned = remove_small_objects(opened.astype(bool), min_size=min_size).astype(np.uint8) * 255

    median_kernel = 5
    final = cv2.medianBlur(cleaned, median_kernel)

    if output_path:
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        imwrite_unicode(output_path, final)
        print(f"二值化图像已保存: {output_path}")

    return final


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='指静脉图像二值化处理器（简化版）')
    parser.add_argument('-i', '--input', required=True, help='输入增强图像路径')
    parser.add_argument('-o', '--output', required=True, help='输出二值化图像路径')
    args = parser.parse_args()

    binarize_vein_image(args.input, args.output)
