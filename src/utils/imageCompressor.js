export const compressImage = (file, maxSizeMB = 3) => {
  return new Promise((resolve, reject) => {
    // If it's not an image (e.g., pdf or something else), return the original file
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    // If it's already smaller than the max size, just return the file
    if (file.size <= maxSizeBytes) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Target dimensions. Start by checking if we need to scale down
        let width = img.width;
        let height = img.height;
        
        // Reduce resolution significantly if file is large. Max 1920x1080 bounding box.
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive function to find the best quality that fits the size limit
        const getBlobWithQuality = (quality) => {
          return new Promise((res) => {
            canvas.toBlob(
              (blob) => {
                res(blob);
              },
              'image/jpeg',
              quality
            );
          });
        };

        const attemptCompression = async () => {
          let quality = 0.9;
          let blob = await getBlobWithQuality(quality);
          
          while (blob.size > maxSizeBytes && quality > 0.3) {
            quality -= 0.15;
            blob = await getBlobWithQuality(quality);
          }

          // If still too large, aggressive resize
          if (blob.size > maxSizeBytes) {
             const scale = Math.sqrt(maxSizeBytes / blob.size);
             canvas.width = width * scale;
             canvas.height = height * scale;
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             blob = await getBlobWithQuality(0.7);
          }

          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        };

        attemptCompression();
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
