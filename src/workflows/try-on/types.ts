/**
 * Try-On Workflow Type Definitions
 */

export interface TryOnInputs {
    model: string | null;
    garment: string | null;
}

export interface TryOnConfig {
    actionText: string;
    aspectRatio: string;
    imageSize: string;
    temperature: number;
    photoStyle: string;
    lensView: string;
    cameraAngle: string;
    bgType: string;
    bgBlur: string;
    lighting: boolean;
}

export interface TryOnAnalysisResult {
    modelDesc: string;
    garmentDesc: string;
}

export interface TryOnExecutionResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}
