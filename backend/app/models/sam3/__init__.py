from typing import Any, List, Optional, Tuple

import numpy as np
import torch
from PIL import Image

from sam3.model_builder import build_sam3_image_model
from sam3.model.sam3_image_processor import Sam3Processor


# Global model and processor instances (loaded at startup).
_model: Optional[Any] = None
_processor: Optional[Sam3Processor] = None


def load_sam3_model(checkpoint_path: str) -> None:
    """Loads the SAM3 model and processor.
    
    This function should be called during application startup to load the 
    SAM3 model into GPU memory (if available).
    
    Args:
        checkpoint_path: Path to the SAM3 model weights file.
    """
    global _model, _processor
    
    # Determine the device to use (GPU if available, otherwise CPU).
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading SAM3 model on device: {device}")
    
    # Build the SAM3 model from local weights.
    _model = build_sam3_image_model(
        device=device,
        eval_mode=True,
        checkpoint_path=checkpoint_path,
        load_from_HF=False,
        enable_segmentation=True,
        enable_inst_interactivity=True,
        compile=False,
    )
    
    # Create the processor.
    _processor = Sam3Processor(_model)
    
    print("SAM3 model loaded successfully.")


def get_model() -> Any:
    """Returns the loaded SAM3 model.
    
    Returns:
        The SAM3 model instance.
        
    Raises:
        RuntimeError: If the model has not been loaded yet.
    """
    if _model is None:
        raise RuntimeError("SAM3 model has not been loaded. Call load_sam3_model() first.")
    return _model


def get_processor() -> Sam3Processor:
    """Returns the loaded SAM3 processor.
    
    Returns:
        The SAM3 processor instance.
        
    Raises:
        RuntimeError: If the processor has not been loaded yet.
    """
    if _processor is None:
        raise RuntimeError("SAM3 processor has not been loaded. Call load_sam3_model() first.")
    return _processor


def _to_numpy(tensor_or_array) -> np.ndarray:
    """Converts a torch tensor or numpy array to a numpy array.
    
    Args:
        tensor_or_array: A torch tensor or numpy array.

    Returns:
        A numpy array.
    """
    if hasattr(tensor_or_array, 'cpu'):
        tensor = tensor_or_array.cpu()
        if tensor.dtype == torch.bfloat16:
            tensor = tensor.float()
        return tensor.numpy()
    return np.asarray(tensor_or_array)


def segment_with_text_prompt(
    image: Image.Image,
    prompt: str,
    confidence_threshold: float = 0.5,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Segments an image using a text prompt.
    
    Args:
        image: The PIL image to segment.
        prompt: The text prompt describing what to segment.
        confidence_threshold: Minimum confidence score for masks.
        
    Returns:
        A tuple of (masks, boxes, scores) where:
        - masks: numpy array of shape (N, 1, H, W) with binary masks
        - boxes: numpy array of shape (N, 4) with bounding boxes
        - scores: numpy array of shape (N,) with confidence scores
    """
    processor = get_processor()
    
    # Set the confidence threshold.
    processor.set_confidence_threshold(confidence_threshold)
    
    # Set the image and get the state.
    state = processor.set_image(image)
    
    # Run text prompt segmentation.
    output = processor.set_text_prompt(state=state, prompt=prompt)
    
    masks = _to_numpy(output["masks"])
    boxes = _to_numpy(output["boxes"])
    scores = _to_numpy(output["scores"])

    return masks, boxes, scores


def segment_with_points(
    image: Image.Image,
    point_coords: np.ndarray,
    point_labels: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Segments an image using point prompts.
    
    Args:
        image: The PIL image to segment.
        point_coords: numpy array of shape (N, 2) with point coordinates.
        point_labels: numpy array of shape (N,) with point labels 
            (1 for foreground, 0 for background).
        
    Returns:
        A tuple of (masks, scores, logits) where:
        - masks: numpy array of shape (N, H, W) with binary masks
        - scores: numpy array of shape (N,) with confidence scores
        - logits: numpy array with mask logits
    """
    model = get_model()
    processor = get_processor()
    
    # Set the image and get the state.
    state = processor.set_image(image)
    
    # Run point-based segmentation with multimask output.
    masks, scores, logits = model.predict_inst(
        state,
        point_coords=point_coords,
        point_labels=point_labels,
        multimask_output=True,
    )
    
    masks = _to_numpy(masks)
    scores = _to_numpy(scores)
    logits = _to_numpy(logits)

    return masks, scores, logits


def combine_masks(masks: np.ndarray) -> np.ndarray:
    """Combines multiple masks into a single mask using logical OR.
    
    Args:
        masks: numpy array of masks. Can be shape (N, 1, H, W) or (N, H, W).
        
    Returns:
        A single combined mask of shape (H, W).
    """
    if masks.size == 0:
        return np.array([])
    
    # Handle different mask shapes.
    if masks.ndim == 4:
        # Shape is (N, 1, H, W) - squeeze the second dimension.
        masks = masks.squeeze(1)
    
    # Combine all masks using logical OR.
    combined = np.any(masks > 0, axis=0).astype(np.uint8)
    
    return combined


def mask_to_list(mask: np.ndarray) -> List[List[int]]:
    """Converts a numpy mask to a nested list for JSON serialization.
    
    Args:
        mask: numpy array of shape (H, W) with binary values.
        
    Returns:
        A nested list of integers representing the mask.
    """
    return mask.astype(int).tolist()
