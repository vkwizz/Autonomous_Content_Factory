import { Jimp } from 'jimp';

Jimp.read('image.png')
  .then(image => {
    image.greyscale();
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      
      // Since it's grayscaled, red, green, and blue are equal.
      // Light pink will be converted to gray > 150ish. The black strokes are near 0.
      if (red > 100) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      } else {
        this.bitmap.data[idx + 0] = 0;
        this.bitmap.data[idx + 1] = 0;
        this.bitmap.data[idx + 2] = 0;
      }
    });

    return image.write('public/logo.png');
  })
  .then(() => {
    console.log('Successfully created logo.png');
  })
  .catch(err => {
    console.error('Error:', err);
  });
