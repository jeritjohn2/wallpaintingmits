'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ViewImage() {
  const router = useRouter();
  const { imageUrl } = router.query; // Destructure imageUrl from router.query
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (imageUrl) {
      setImageSrc(imageUrl);
    }
  }, [imageUrl]); // Only update imageSrc when imageUrl changes

  if (!imageSrc) {
    return <p>Loading...</p>; // Or some fallback UI while the imageUrl is being fetched
  }

  return (
    <div className="image-container">
      <img src={imageSrc} alt="Contractor Image" />
    </div>
  );
}
