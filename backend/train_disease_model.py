"""
KrishiVaani — Disease Detection PyTorch Training Script
========================================================
Trains a MobileNetV2 Transfer Learning CNN on PlantVillage disease images.
Supports balanced class sampling for fast CPU training (~1-2 min) or full dataset on GPU.
Saves model checkpoint: backend/app/services/disease_detection/disease_cnn.pt
Saves class labels:     backend/app/services/disease_detection/disease_classes.json
"""

import os
import sys
import json
import time
import argparse
import random
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms, models

DATA_DIR    = os.path.join(os.path.dirname(__file__), "data", "disease_detection")
SERVICE_DIR = os.path.join(os.path.dirname(__file__), "app", "services", "disease_detection")
MODEL_PATH  = os.path.join(SERVICE_DIR, "disease_cnn.pt")
LABELS_PATH = os.path.join(SERVICE_DIR, "disease_classes.json")

class BalancedPlantVillageDataset(Dataset):
    def __init__(self, data_dir, max_per_class=100, transform=None):
        self.transform = transform
        self.samples = []
        self.classes = []
        self.class_to_idx = {}

        # Scan valid non-empty folders
        raw_classes = sorted([d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))])
        valid_classes = []
        for c in raw_classes:
            folder = os.path.join(data_dir, c)
            imgs = [os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if len(imgs) > 0:
                valid_classes.append(c)

        self.classes = valid_classes
        self.class_to_idx = {c: i for i, c in enumerate(valid_classes)}

        for c in valid_classes:
            folder = os.path.join(data_dir, c)
            imgs = [os.path.join(folder, f) for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            if max_per_class > 0 and len(imgs) > max_per_class:
                random.seed(42)
                imgs = random.sample(imgs, max_per_class)
            for img_path in imgs:
                self.samples.append((img_path, self.class_to_idx[c]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, label

def train(max_per_class=100, epochs=5, batch_size=32, lr=1e-3):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Running on device: {device}")

    img_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    print(f"[INFO] Scanning image classes from {DATA_DIR} (max {max_per_class} per class)...")
    dataset = BalancedPlantVillageDataset(DATA_DIR, max_per_class=max_per_class, transform=img_transform)
    num_classes = len(dataset.classes)
    print(f"[INFO] Found {num_classes} valid classes with {len(dataset)} total balanced images.")

    val_size = int(len(dataset) * 0.15)
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size], generator=torch.Generator().manual_seed(42))

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    print("[INFO] Initializing MobileNetV2 with pre-trained weights...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)

    # Freeze feature extractor
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace classifier
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(model.last_channel, 256),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes)
    )

    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=lr)

    print(f"\n{'='*55}\nStarting Training ({epochs} epochs)...\n{'='*55}")
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss, train_correct, total_train = 0.0, 0, 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            train_correct += (outputs.argmax(dim=1) == labels).sum().item()
            total_train += images.size(0)

        # Validation
        model.eval()
        val_loss, val_correct, total_val = 0.0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                val_correct += (outputs.argmax(dim=1) == labels).sum().item()
                total_val += images.size(0)

        t_acc = (train_correct / total_train) * 100
        v_acc = (val_correct / total_val) * 100
        elapsed = time.time() - t0

        print(f"Epoch [{epoch}/{epochs}] ({elapsed:.1f}s) | Train Acc: {t_acc:.1f}% | Val Acc: {v_acc:.1f}% | Loss: {train_loss/total_train:.4f}")

        if v_acc > best_val_acc:
            best_val_acc = v_acc
            torch.save({
                'model_state_dict': model.state_dict(),
                'classes': dataset.classes,
                'class_to_idx': dataset.class_to_idx,
                'val_accuracy': v_acc,
                'architecture': 'mobilenet_v2'
            }, MODEL_PATH)

    # Save classes JSON
    with open(LABELS_PATH, "w") as f:
        json.dump({
            "classes": dataset.classes,
            "class_to_idx": dataset.class_to_idx,
            "best_val_acc": best_val_acc,
            "architecture": "mobilenet_v2"
        }, f, indent=2)

    print(f"\n[SUCCESS] PyTorch Disease CNN trained! Best Val Accuracy: {best_val_acc:.1f}%")
    print(f"[SUCCESS] Model saved to: {MODEL_PATH}")
    print(f"[SUCCESS] Classes saved to: {LABELS_PATH}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--max_per_class', type=int, default=100)
    parser.add_argument('--epochs', type=int, default=5)
    args = parser.parse_args()
    train(max_per_class=args.max_per_class, epochs=args.epochs)
