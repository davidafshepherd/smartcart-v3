from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.constants import BACKEND_DIR


# Create a new API router to group image-related endpoints.
router = APIRouter()


# GET endpoint to serve an image from the backend.
@router.get("/{path:path}", status_code=status.HTTP_200_OK)
def get_image(path: str) -> FileResponse:
    """Serves an image from the backend.
        
    Args:
        path: Path to the image relative to the backend directory.
        
    Returns:
        A file response containing the image's path and media type.
        
    Raises:
        HTTPException: If the image does not exist.
    """
    
    # Store the absolute path to the image.
    image_path = BACKEND_DIR / path
    
    # Check if the image exists.
    if not image_path.exists() or not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image not found: {path}",
        )
    
    # Store the media type of the image.
    media_type = (
        "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    )
    
    # Return a file response containing the image's path and media type.
    return FileResponse(image_path, media_type=media_type)
