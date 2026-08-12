import { imageService } from '@/services/imageService';


interface Props {
  label: string;
  path: string;
}


export function ImageCard({ label, path }: Props) {
  return (
    <div className="meal-details-image-card">
      <p className="meal-details-image-card-label">{label}</p>
      <img src={imageService.getImageUrl(path)} alt={`${label} image`} />
    </div>
  );
}
